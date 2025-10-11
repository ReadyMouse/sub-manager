import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * SubChainSubscription Comprehensive Test Suite
 * 
 * Tests the complete subscription lifecycle:
 * 1. Provider registration (public verified, public unverified, private)
 * 2. Subscription creation with various limit configurations
 * 3. Payment processing with success and failure scenarios
 * 4. Automatic cancellation (expiry, max payments, failures)
 * 5. View functions and edge cases
 * 
 * Testing on Ethereum mainnet fork with real PYUSD token
 */

describe("SubChainSubscription", function () {
  // ========================================
  // CONSTANTS
  // ========================================
  
  // Real PYUSD contract address on Ethereum mainnet
  const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
  
  // Address that holds PYUSD tokens (we'll impersonate this to get test tokens)
  // This address has ~15.8 million PYUSD
  const PYUSD_WHALE = "0xCFFAd3200574698b78f32232aa9D63eABD290703";
  
  // Test constants
  const ONE_DAY = 24 * 60 * 60;
  const THIRTY_DAYS = 30 * ONE_DAY;
  
  // ========================================
  // CONTRACTS & SIGNERS
  // ========================================
  
  let subChainContract: SubChainSubscription;
  let pyusdContract: IERC20Metadata;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let serviceProvider: HardhatEthersSigner;
  let landlord: HardhatEthersSigner;
  
  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  
  /**
   * Fund an account with PYUSD by impersonating the whale address
   * @param recipient Address to receive PYUSD
   * @param amount Amount of PYUSD to send (in base units, 6 decimals)
   */
  async function fundAccountWithPyusd(recipient: string, amount: bigint) {
    // Impersonate the whale address
    await ethers.provider.send("hardhat_impersonateAccount", [PYUSD_WHALE]);
    const whaleSigner = await ethers.getSigner(PYUSD_WHALE);
    
    // Send ETH to whale for gas fees
    await owner.sendTransaction({
      to: PYUSD_WHALE,
      value: ethers.parseEther("1.0")
    });
    
    // Transfer PYUSD from whale to recipient
    await pyusdContract.connect(whaleSigner).transfer(recipient, amount);
    
    // Stop impersonating
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [PYUSD_WHALE]);
  }
  
  // ========================================
  // SETUP & FIXTURES
  // ========================================
  
  before(async function () {
    console.log("\n🚀 Setting up SubChainSubscription test environment...");
    
    // Get signers
    [owner, user1, user2, serviceProvider, landlord] = await ethers.getSigners();
    
    console.log("📋 Test Accounts:");
    console.log("  Owner:", owner.address);
    console.log("  User1:", user1.address);
    console.log("  User2:", user2.address);
    console.log("  Service Provider:", serviceProvider.address);
    console.log("  Landlord:", landlord.address);
    
    // Get PYUSD contract instance
    pyusdContract = await ethers.getContractAt("IERC20Metadata", PYUSD_ADDRESS);
    console.log("\n💰 Connected to PYUSD:", PYUSD_ADDRESS);
    
    // Deploy SubChainSubscription contract
    const SubChainSubscription = await ethers.getContractFactory("SubChainSubscription");
    subChainContract = await SubChainSubscription.deploy(owner.address, PYUSD_ADDRESS);
    await subChainContract.waitForDeployment();
    
    const contractAddress = await subChainContract.getAddress();
    console.log("📝 SubChainSubscription deployed:", contractAddress);
    
    // Fund test accounts with PYUSD
    console.log("\n💸 Funding test accounts with PYUSD...");
    const fundAmount = ethers.parseUnits("10000", 6); // 10,000 PYUSD each
    
    await fundAccountWithPyusd(user1.address, fundAmount);
    await fundAccountWithPyusd(user2.address, fundAmount);
    
    const user1Balance = await pyusdContract.balanceOf(user1.address);
    const user2Balance = await pyusdContract.balanceOf(user2.address);
    
    console.log("  User1 balance:", ethers.formatUnits(user1Balance, 6), "PYUSD");
    console.log("  User2 balance:", ethers.formatUnits(user2Balance, 6), "PYUSD");
    
    console.log("\n✅ Setup complete!\n");
  });
  
  describe("Setup Verification", function () {
    it("Should have deployed SubChainSubscription contract", async function () {
      const contractAddress = await subChainContract.getAddress();
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should have correct PYUSD token address", async function () {
      expect(await subChainContract.pyusdToken()).to.equal(PYUSD_ADDRESS);
    });
    
    it("Should have correct owner", async function () {
      expect(await subChainContract.owner()).to.equal(owner.address);
    });
    
    it("Should have funded test accounts with PYUSD", async function () {
      const user1Balance = await pyusdContract.balanceOf(user1.address);
      const user2Balance = await pyusdContract.balanceOf(user2.address);
      
      expect(user1Balance).to.be.gt(0);
      expect(user2Balance).to.be.gt(0);
    });
  });
  
  // ========================================
  // PROVIDER REGISTRATION TESTS
  // ========================================
  
  describe("Provider Registration", function () {
    const NETFLIX_ID = 1;
    const SPOTIFY_ID = 2;
    
    describe("Public Verified Providers (Owner Only)", function () {
      it("Should allow owner to register a verified public provider", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            NETFLIX_ID,
            serviceProvider.address,
            0 // PaymentType.DirectCrypto
          )
        ).to.emit(subChainContract, "ServiceProviderUpdated")
          .withArgs(NETFLIX_ID, serviceProvider.address, 0, 0, ethers.ZeroAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
      });
      
      it("Should verify provider exists and has correct data", async function () {
        expect(await subChainContract.providerExists(NETFLIX_ID)).to.be.true;
        expect(await subChainContract.getProviderAddress(NETFLIX_ID)).to.equal(serviceProvider.address);
        expect(await subChainContract.getProviderType(NETFLIX_ID)).to.equal(0); // PublicVerified
        expect(await subChainContract.getProviderOwner(NETFLIX_ID)).to.equal(ethers.ZeroAddress);
        expect(await subChainContract.getProviderPaymentType(NETFLIX_ID)).to.equal(0); // DirectCrypto
      });
      
      it("Should revert if non-owner tries to register verified provider", async function () {
        await expect(
          subChainContract.connect(user1).registerServiceProvider(
            SPOTIFY_ID,
            serviceProvider.address,
            0
          )
        ).to.be.revertedWithCustomError(subChainContract, "OwnableUnauthorizedAccount");
      });
      
      it("Should revert with invalid provider ID", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            0,
            serviceProvider.address,
            0
          )
        ).to.be.revertedWith("Invalid service provider ID");
      });
      
      it("Should revert with invalid payment address", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            SPOTIFY_ID,
            ethers.ZeroAddress,
            0
          )
        ).to.be.revertedWith("Invalid payment address");
      });
    });
    
    describe("Public Unverified Providers (Any User)", function () {
      let unverifiedProviderId: bigint;
      
      it("Should allow any user to register an unverified public provider", async function () {
        const tx = await subChainContract.connect(user1).registerPublicUnverifiedProvider(serviceProvider.address);
        const receipt = await tx.wait();
        
        // Extract provider ID from event
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "ServiceProviderUpdated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        unverifiedProviderId = parsedEvent!.args[0];
        
        expect(unverifiedProviderId).to.be.gt(0);
      });
      
      it("Should have correct provider type and owner", async function () {
        expect(await subChainContract.providerExists(unverifiedProviderId)).to.be.true;
        expect(await subChainContract.getProviderType(unverifiedProviderId)).to.equal(1); // PublicUnverified
        expect(await subChainContract.getProviderOwner(unverifiedProviderId)).to.equal(user1.address);
        expect(await subChainContract.getProviderPaymentType(unverifiedProviderId)).to.equal(0); // DirectCrypto only
      });
      
      it("Should revert with invalid payment address", async function () {
        await expect(
          subChainContract.connect(user1).registerPublicUnverifiedProvider(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid payment address");
      });
    });
    
    describe("Private Providers (Any User)", function () {
      let privateProviderId: bigint;
      
      it("Should allow any user to register a private provider", async function () {
        const tx = await subChainContract.connect(user1).registerPrivateProvider(landlord.address);
        const receipt = await tx.wait();
        
        // Extract provider ID from event
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "ServiceProviderUpdated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        privateProviderId = parsedEvent!.args[0];
        
        expect(privateProviderId).to.be.gt(0);
      });
      
      it("Should have correct provider type and owner", async function () {
        expect(await subChainContract.providerExists(privateProviderId)).to.be.true;
        expect(await subChainContract.getProviderType(privateProviderId)).to.equal(2); // Private
        expect(await subChainContract.getProviderOwner(privateProviderId)).to.equal(user1.address);
        expect(await subChainContract.getProviderAddress(privateProviderId)).to.equal(landlord.address);
        expect(await subChainContract.getProviderPaymentType(privateProviderId)).to.equal(0); // DirectCrypto only
      });
    });
    
    describe("Provider Query Functions", function () {
      it("Should return false for non-existent provider", async function () {
        expect(await subChainContract.providerExists(99999)).to.be.false;
      });
      
      it("Should revert when querying non-existent provider data", async function () {
        await expect(
          subChainContract.getProviderAddress(99999)
        ).to.be.revertedWith("Service provider does not exist");
        
        await expect(
          subChainContract.getProviderType(99999)
        ).to.be.revertedWith("Service provider does not exist");
      });
    });
  });
  
  // ========================================
  // SUBSCRIPTION CREATION TESTS
  // ========================================
  
  describe("Subscription Creation", function () {
    const NETFLIX_ID = 1;
    let subscriptionId: bigint;
    
    before(async function () {
      // Register Netflix as a provider for these tests
      await subChainContract.connect(owner).registerServiceProvider(
        NETFLIX_ID,
        serviceProvider.address,
        0 // PaymentType.DirectCrypto
      );
    });
    
    describe("Happy Path - Valid Subscriptions", function () {
      it("Should create subscription with unlimited duration (no endDate, no maxPayments)", async function () {
        const amount = ethers.parseUnits("10", 6); // 10 PYUSD
        const interval = THIRTY_DAYS;
        
        // User1 approves contract to spend PYUSD
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("1000", 6) // Approve 1000 PYUSD for multiple payments
        );
        
        // Create subscription
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Premium",
          0, // endDate = 0 (unlimited)
          0, // maxPayments = 0 (unlimited)
          false // not private
        );
        
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        // Extract subscription ID from event
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        subscriptionId = parsedEvent!.args[0];
        
        expect(subscriptionId).to.equal(1); // First subscription
        
        // Verify event was emitted with correct parameters
        await expect(tx).to.emit(subChainContract, "SubscriptionCreated")
          .withArgs(
            subscriptionId,
            user1.address,
            NETFLIX_ID,
            amount,
            interval,
            block!.timestamp + interval, // nextPaymentDue
            0, // endDate (unlimited)
            0, // maxPayments (unlimited)
            "Netflix Premium",
            false,
            block!.timestamp
          );
        
        console.log("  ✅ Created subscription ID:", subscriptionId.toString());
      });
      
      it("Should verify subscription data is stored correctly", async function () {
        const sub = await subChainContract.getSubscription(subscriptionId);
        
        expect(sub.id).to.equal(subscriptionId);
        expect(sub.subscriber).to.equal(user1.address);
        expect(sub.serviceProviderId).to.equal(NETFLIX_ID);
        expect(sub.amount).to.equal(ethers.parseUnits("10", 6));
        expect(sub.interval).to.equal(THIRTY_DAYS);
        expect(sub.isActive).to.be.true;
        expect(sub.isPrivate).to.be.false;
        expect(sub.failedPaymentCount).to.equal(0);
        expect(sub.paymentCount).to.equal(0);
        expect(sub.serviceName).to.equal("Netflix Premium");
        expect(sub.endDate).to.equal(0);
        expect(sub.maxPayments).to.equal(0);
      });
      
      it("Should add subscription to user's subscription list", async function () {
        const userSubs = await subChainContract.getUserSubscriptions(user1.address);
        expect(userSubs.length).to.equal(1);
        expect(userSubs[0]).to.equal(subscriptionId);
      });
      
      it("Should create subscription with endDate only (no maxPayments)", async function () {
        const amount = ethers.parseUnits("20", 6); // 20 PYUSD
        const interval = THIRTY_DAYS;
        const endDate = Math.floor(Date.now() / 1000) + (365 * ONE_DAY); // 1 year from now
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Premium Annual",
          endDate,
          0, // maxPayments = 0 (unlimited, but limited by endDate)
          false
        );
        
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        const sub = await subChainContract.getSubscription(newSubId);
        expect(sub.endDate).to.equal(endDate);
        expect(sub.maxPayments).to.equal(0);
        
        console.log("  ✅ Created subscription with endDate:", new Date(endDate * 1000).toISOString());
      });
      
      it("Should create subscription with maxPayments only (no endDate)", async function () {
        const amount = ethers.parseUnits("15", 6); // 15 PYUSD
        const interval = THIRTY_DAYS;
        const maxPayments = 12; // 12 payments
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix 12-Month Plan",
          0, // endDate = 0 (unlimited, but limited by maxPayments)
          maxPayments,
          false
        );
        
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        const sub = await subChainContract.getSubscription(newSubId);
        expect(sub.maxPayments).to.equal(maxPayments);
        
        // When maxPayments is set, endDate is calculated automatically
        const expectedEndDate = block!.timestamp + (maxPayments * interval);
        expect(sub.endDate).to.equal(expectedEndDate);
        
        console.log("  ✅ Created subscription with maxPayments:", maxPayments);
        console.log("  📅 Calculated endDate:", new Date(Number(sub.endDate) * 1000).toISOString());
      });
      
      it("Should create subscription with both endDate and maxPayments (earlier limit applies)", async function () {
        const amount = ethers.parseUnits("25", 6); // 25 PYUSD
        const interval = THIRTY_DAYS;
        const maxPayments = 6; // 6 payments (6 months)
        const endDate = Math.floor(Date.now() / 1000) + (365 * ONE_DAY); // 1 year from now
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Flexible Plan",
          endDate,
          maxPayments,
          false
        );
        
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        const sub = await subChainContract.getSubscription(newSubId);
        
        // maxPayments ends in 6 months, endDate is 1 year
        // So endDate should be the earlier one (from maxPayments calculation)
        const calculatedEndFromPayments = block!.timestamp + (maxPayments * interval);
        expect(sub.endDate).to.equal(calculatedEndFromPayments);
        expect(sub.maxPayments).to.equal(maxPayments);
        
        console.log("  ✅ Both limits set - earlier limit (maxPayments) applies");
      });
      
      it("Should create subscription with isPrivate flag", async function () {
        const amount = ethers.parseUnits("30", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Private Subscription",
          0,
          0,
          true // private subscription
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        const sub = await subChainContract.getSubscription(newSubId);
        expect(sub.isPrivate).to.be.true;
        
        console.log("  ✅ Created private subscription");
      });
      
      it("Should allow multiple subscriptions from same user to same provider", async function () {
        const amount = ethers.parseUnits("5", 6);
        const interval = THIRTY_DAYS;
        
        // Create another subscription to Netflix
        await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Basic",
          0,
          0,
          false
        );
        
        const userSubs = await subChainContract.getUserSubscriptions(user1.address);
        
        // User1 should now have 6 subscriptions total (from all the tests above)
        expect(userSubs.length).to.equal(6);
        
        console.log("  ✅ User can have multiple subscriptions to same provider");
      });
      
      it("Should allow different users to subscribe to same provider", async function () {
        const amount = ethers.parseUnits("10", 6);
        const interval = THIRTY_DAYS;
        
        // User2 approves and creates subscription
        await pyusdContract.connect(user2).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("1000", 6)
        );
        
        await subChainContract.connect(user2).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Premium",
          0,
          0,
          false
        );
        
        const user2Subs = await subChainContract.getUserSubscriptions(user2.address);
        expect(user2Subs.length).to.equal(1);
        
        console.log("  ✅ Multiple users can subscribe to same provider");
      });
    });
    
    describe("Revert Cases - Invalid Parameters", function () {
      const amount = ethers.parseUnits("10", 6);
      const interval = THIRTY_DAYS;
      
      it("Should revert if service provider does not exist", async function () {
        await expect(
          subChainContract.connect(user1).createSubscription(
            99999, // Non-existent provider
            amount,
            interval,
            "Test Service",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Service provider not registered");
      });
      
      it("Should revert if amount is zero", async function () {
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            0, // Invalid amount
            interval,
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Amount must be greater than 0");
      });
      
      it("Should revert if interval is less than 1 day", async function () {
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            amount,
            ONE_DAY - 1, // Too short
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Interval must be at least 1 day");
      });
      
      it("Should revert if interval is more than 365 days", async function () {
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            amount,
            (365 * ONE_DAY) + 1, // Too long
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Interval must be at most 365 days");
      });
      
      it("Should revert if service name is empty", async function () {
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            amount,
            interval,
            "", // Empty name
            0,
            0,
            false
          )
        ).to.be.revertedWith("Service name cannot be empty");
      });
      
      it("Should revert if service name is too long", async function () {
        const longName = "A".repeat(101); // 101 characters
        
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            amount,
            interval,
            longName,
            0,
            0,
            false
          )
        ).to.be.revertedWith("Service name too long");
      });
      
      it("Should revert if endDate is in the past", async function () {
        const pastDate = Math.floor(Date.now() / 1000) - ONE_DAY; // Yesterday
        
        await expect(
          subChainContract.connect(user1).createSubscription(
            NETFLIX_ID,
            amount,
            interval,
            "Netflix Premium",
            pastDate,
            0,
            false
          )
        ).to.be.revertedWith("End date must be in future");
      });
      
      it("Should revert if insufficient PYUSD allowance", async function () {
        // Create a fresh user without approval
        const [, , , , , newUser] = await ethers.getSigners();
        
        // Fund them with PYUSD but don't approve the contract
        await fundAccountWithPyusd(newUser.address, ethers.parseUnits("1000", 6));
        
        await expect(
          subChainContract.connect(newUser).createSubscription(
            NETFLIX_ID,
            amount,
            interval,
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Insufficient PYUSD allowance - approve contract to spend PYUSD");
      });
      
      it("Should revert if insufficient PYUSD balance", async function () {
        const [, , , , , , poorUser] = await ethers.getSigners();
        
        // Fund with only 5 PYUSD but try to create 10 PYUSD subscription
        await fundAccountWithPyusd(poorUser.address, ethers.parseUnits("5", 6));
        
        // Approve the contract
        await pyusdContract.connect(poorUser).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("1000", 6)
        );
        
        await expect(
          subChainContract.connect(poorUser).createSubscription(
            NETFLIX_ID,
            ethers.parseUnits("10", 6), // More than balance
            interval,
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Insufficient PYUSD balance for first payment");
      });
      
      it("Should revert if insufficient allowance for subscription amount", async function () {
        const [, , , , , , , underApprovedUser] = await ethers.getSigners();
        
        // Fund with plenty of PYUSD
        await fundAccountWithPyusd(underApprovedUser.address, ethers.parseUnits("1000", 6));
        
        // Approve less than the subscription amount
        await pyusdContract.connect(underApprovedUser).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("5", 6) // Only 5 PYUSD approved
        );
        
        await expect(
          subChainContract.connect(underApprovedUser).createSubscription(
            NETFLIX_ID,
            ethers.parseUnits("10", 6), // More than allowance
            interval,
            "Netflix Premium",
            0,
            0,
            false
          )
        ).to.be.revertedWith("Insufficient PYUSD allowance - approve contract to spend PYUSD");
      });
    });
  });
  
  // ========================================
  // PAYMENT PROCESSING TESTS
  // ========================================
  
  describe("Payment Processing", function () {
    const NETFLIX_ID = 1;
    let testSubscriptionId: bigint;
    
    before(async function () {
      // Register Netflix as a provider for these tests
      await subChainContract.connect(owner).registerServiceProvider(
        NETFLIX_ID,
        serviceProvider.address,
        0 // PaymentType.DirectCrypto
      );
      
      // Create a test subscription for payment processing tests
      const amount = ethers.parseUnits("50", 6); // 50 PYUSD
      const interval = THIRTY_DAYS;
      
      // Approve PYUSD
      await pyusdContract.connect(user1).approve(
        await subChainContract.getAddress(),
        ethers.parseUnits("10000", 6)
      );
      
      // Create subscription
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix Test Sub",
        0,
        0,
        false
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      testSubscriptionId = parsedEvent!.args[0];
    });
    
    describe("Successful Payment Processing", function () {
      it("Should successfully process payment when due", async function () {
        // Fast-forward time to when payment is due (30 days)
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Get balances before payment
        const user1BalanceBefore = await pyusdContract.balanceOf(user1.address);
        const providerBalanceBefore = await pyusdContract.balanceOf(serviceProvider.address);
        
        // Get subscription state before payment
        const subBefore = await subChainContract.getSubscription(testSubscriptionId);
        
        // Process payment
        const tx = await subChainContract.processPayment(testSubscriptionId);
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        // Get balances after payment
        const user1BalanceAfter = await pyusdContract.balanceOf(user1.address);
        const providerBalanceAfter = await pyusdContract.balanceOf(serviceProvider.address);
        
        // Get subscription state after payment
        const subAfter = await subChainContract.getSubscription(testSubscriptionId);
        
        // Verify PYUSD was transferred
        expect(user1BalanceBefore - user1BalanceAfter).to.equal(ethers.parseUnits("50", 6));
        expect(providerBalanceAfter - providerBalanceBefore).to.equal(ethers.parseUnits("50", 6));
        
        // Verify subscription state was updated
        expect(subAfter.paymentCount).to.equal(1);
        expect(subAfter.failedPaymentCount).to.equal(0);
        expect(subAfter.nextPaymentDue).to.equal(block!.timestamp + THIRTY_DAYS);
        expect(subAfter.isActive).to.be.true;
        
        // Verify PaymentProcessed event was emitted
        await expect(tx).to.emit(subChainContract, "PaymentProcessed")
          .withArgs(
            testSubscriptionId,
            user1.address,
            NETFLIX_ID,
            ethers.parseUnits("50", 6),
            1, // paymentCount
            block!.timestamp,
            block!.timestamp + THIRTY_DAYS // nextPaymentDue
          );
        
        console.log("  ✅ Payment processed successfully");
        console.log("  💰 50 PYUSD transferred from user to provider");
        console.log("  📊 Payment count:", subAfter.paymentCount.toString());
      });
      
      it("Should process second payment correctly", async function () {
        // Fast-forward time to when next payment is due (another 30 days)
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        const subBefore = await subChainContract.getSubscription(testSubscriptionId);
        
        // Process second payment
        await subChainContract.processPayment(testSubscriptionId);
        
        const subAfter = await subChainContract.getSubscription(testSubscriptionId);
        
        // Payment count should increment
        expect(subAfter.paymentCount).to.equal(2);
        expect(subAfter.isActive).to.be.true;
        
        console.log("  ✅ Second payment processed");
        console.log("  📊 Payment count:", subAfter.paymentCount.toString());
      });
      
      it("Should allow anyone to call processPayment (not just subscriber)", async function () {
        // Fast-forward time
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // User2 (not the subscriber) calls processPayment - should work
        const tx = await subChainContract.connect(user2).processPayment(testSubscriptionId);
        
        await expect(tx).to.emit(subChainContract, "PaymentProcessed");
        
        const subAfter = await subChainContract.getSubscription(testSubscriptionId);
        expect(subAfter.paymentCount).to.equal(3);
        
        console.log("  ✅ Payment can be processed by anyone (important for automation)");
      });
      
      it("Should reset failedPaymentCount on successful payment", async function () {
        // Create a new subscription that will have a failed payment first
        const amount = ethers.parseUnits("20", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Reset Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        // Fast-forward time
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Remove all PYUSD from user1 to force a failed payment
        const user1Balance = await pyusdContract.balanceOf(user1.address);
        await pyusdContract.connect(user1).transfer(user2.address, user1Balance);
        
        // Try to process payment - should fail
        await subChainContract.processPayment(newSubId);
        
        let sub = await subChainContract.getSubscription(newSubId);
        expect(sub.failedPaymentCount).to.equal(1);
        
        // Give user1 PYUSD back
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        
        // Approve again
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("1000", 6)
        );
        
        // Process payment successfully
        await subChainContract.processPayment(newSubId);
        
        sub = await subChainContract.getSubscription(newSubId);
        
        // Failed payment count should be reset to 0
        expect(sub.failedPaymentCount).to.equal(0);
        expect(sub.paymentCount).to.equal(1);
        
        console.log("  ✅ Failed payment count reset after successful payment");
      });
    });
    
    describe("Payment Processing - Revert Cases", function () {
      it("Should revert if payment not yet due", async function () {
        // Create a fresh subscription
        const amount = ethers.parseUnits("10", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Not Due Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        // Try to process payment immediately (not due for 30 days)
        await expect(
          subChainContract.processPayment(newSubId)
        ).to.be.revertedWith("Payment not due yet");
        
        console.log("  ✅ Correctly reverts when payment not due");
      });
      
      it("Should revert if subscription does not exist", async function () {
        await expect(
          subChainContract.processPayment(99999)
        ).to.be.revertedWith("Subscription does not exist");
      });
      
      it("Should revert if subscription is not active", async function () {
        // Create and then cancel a subscription
        const amount = ethers.parseUnits("10", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Inactive Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const cancelSubId = parsedEvent!.args[0];
        
        // Cancel the subscription
        await subChainContract.connect(user1).cancelSubscription(cancelSubId);
        
        // Fast-forward time so payment would be due
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Try to process payment on cancelled subscription
        await expect(
          subChainContract.processPayment(cancelSubId)
        ).to.be.revertedWith("Subscription is not active");
        
        console.log("  ✅ Correctly reverts for inactive subscriptions");
      });
    });
    
    describe("Failed Payment Handling", function () {
      it("Should handle payment with insufficient balance", async function () {
        // Create subscription
        const amount = ethers.parseUnits("100", 6); // 100 PYUSD
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Insufficient Balance Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const insuffBalanceSubId = parsedEvent!.args[0];
        
        // Fast-forward time
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Remove most of user1's PYUSD (leave less than 100)
        const user1Balance = await pyusdContract.balanceOf(user1.address);
        const amountToRemove = user1Balance - ethers.parseUnits("50", 6); // Leave only 50 PYUSD
        await pyusdContract.connect(user1).transfer(user2.address, amountToRemove);
        
        // Try to process payment - should fail gracefully
        const paymentTx = await subChainContract.processPayment(insuffBalanceSubId);
        
        // Verify PaymentFailed event was emitted
        await expect(paymentTx).to.emit(subChainContract, "PaymentFailed")
          .withArgs(
            insuffBalanceSubId,
            user1.address,
            NETFLIX_ID,
            amount,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp),
            "Insufficient PYUSD balance",
            1 // failedCount
          );
        
        // Verify subscription state
        const sub = await subChainContract.getSubscription(insuffBalanceSubId);
        expect(sub.failedPaymentCount).to.equal(1);
        expect(sub.paymentCount).to.equal(0);
        expect(sub.isActive).to.be.true; // Still active after first failure
        
        console.log("  ✅ Insufficient balance handled gracefully");
        console.log("  📊 Failed payment count:", sub.failedPaymentCount.toString());
      });
      
      it("Should handle payment with insufficient allowance", async function () {
        // Create subscription
        const amount = ethers.parseUnits("50", 6);
        const interval = THIRTY_DAYS;
        
        // Approve exactly the amount for first payment only
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          amount
        );
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Insufficient Allowance Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const insuffAllowanceSubId = parsedEvent!.args[0];
        
        // Fast-forward time
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Revoke allowance
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          0
        );
        
        // Try to process payment - should fail gracefully
        const paymentTx = await subChainContract.processPayment(insuffAllowanceSubId);
        
        // Verify PaymentFailed event was emitted
        await expect(paymentTx).to.emit(subChainContract, "PaymentFailed");
        
        // Verify subscription state
        const sub = await subChainContract.getSubscription(insuffAllowanceSubId);
        expect(sub.failedPaymentCount).to.equal(1);
        expect(sub.paymentCount).to.equal(0);
        expect(sub.isActive).to.be.true;
        
        console.log("  ✅ Insufficient allowance handled gracefully");
        console.log("  📊 Failed payment count:", sub.failedPaymentCount.toString());
      });
      
      it("Should increment failedPaymentCount on consecutive failures", async function () {
        // Create subscription
        const amount = ethers.parseUnits("100", 6);
        const interval = THIRTY_DAYS;
        
        // Re-fund and re-approve PYUSD (may have been depleted in previous tests)
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("10000", 6)
        );
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Consecutive Failures Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const failureSubId = parsedEvent!.args[0];
        
        // Remove user's PYUSD to cause failures
        const user1Balance = await pyusdContract.balanceOf(user1.address);
        await pyusdContract.connect(user1).transfer(user2.address, user1Balance);
        
        // Fast-forward and process - failure 1
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        await subChainContract.processPayment(failureSubId);
        
        let sub = await subChainContract.getSubscription(failureSubId);
        expect(sub.failedPaymentCount).to.equal(1);
        expect(sub.isActive).to.be.true;
        
        // Process again without fixing - failure 2
        await subChainContract.processPayment(failureSubId);
        
        sub = await subChainContract.getSubscription(failureSubId);
        expect(sub.failedPaymentCount).to.equal(2);
        expect(sub.isActive).to.be.true;
        
        console.log("  ✅ Failed payment count increments correctly");
        console.log("  📊 Failed payment count after 2 failures:", sub.failedPaymentCount.toString());
      });
      
      it("Should auto-cancel subscription after 3 consecutive failed payments", async function () {
        // Create subscription
        const amount = ethers.parseUnits("100", 6);
        const interval = THIRTY_DAYS;
        
        // Re-fund and re-approve PYUSD (may have been depleted in previous tests)
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("10000", 6)
        );
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Auto-Cancel Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const autoCancelSubId = parsedEvent!.args[0];
        
        // Remove user's PYUSD to cause failures
        const user1Balance = await pyusdContract.balanceOf(user1.address);
        await pyusdContract.connect(user1).transfer(user2.address, user1Balance);
        
        // Fast-forward and process - failure 1
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        await subChainContract.processPayment(autoCancelSubId);
        
        let sub = await subChainContract.getSubscription(autoCancelSubId);
        expect(sub.failedPaymentCount).to.equal(1);
        expect(sub.isActive).to.be.true;
        
        // Process again - failure 2
        await subChainContract.processPayment(autoCancelSubId);
        
        sub = await subChainContract.getSubscription(autoCancelSubId);
        expect(sub.failedPaymentCount).to.equal(2);
        expect(sub.isActive).to.be.true;
        
        // Process third time - failure 3, should auto-cancel
        const thirdAttempt = await subChainContract.processPayment(autoCancelSubId);
        
        sub = await subChainContract.getSubscription(autoCancelSubId);
        expect(sub.failedPaymentCount).to.equal(3);
        expect(sub.isActive).to.be.false; // Auto-cancelled!
        
        // Verify SubscriptionCancelled event was emitted
        await expect(thirdAttempt).to.emit(subChainContract, "SubscriptionCancelled")
          .withArgs(
            autoCancelSubId,
            user1.address,
            NETFLIX_ID,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp),
            "auto_cancelled_failures"
          );
        
        console.log("  ✅ Subscription auto-cancelled after 3 consecutive failures");
        console.log("  📊 Final failed payment count:", sub.failedPaymentCount.toString());
        console.log("  ⚠️  Subscription is now inactive");
      });
      
      it("Should not allow payment processing on auto-cancelled subscription", async function () {
        // Create subscription
        const amount = ethers.parseUnits("100", 6);
        const interval = THIRTY_DAYS;
        
        // Re-fund and re-approve PYUSD (may have been depleted in previous tests)
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("10000", 6)
        );
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Auto-Cancel Verify Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const verifySubId = parsedEvent!.args[0];
        
        // Remove PYUSD
        const user1Balance = await pyusdContract.balanceOf(user1.address);
        await pyusdContract.connect(user1).transfer(user2.address, user1Balance);
        
        // Fast-forward and cause 3 failures
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        await subChainContract.processPayment(verifySubId); // Failure 1
        await subChainContract.processPayment(verifySubId); // Failure 2
        await subChainContract.processPayment(verifySubId); // Failure 3 & auto-cancel
        
        // Give user PYUSD back
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("1000", 6)
        );
        
        // Try to process payment on cancelled subscription - should revert
        await expect(
          subChainContract.processPayment(verifySubId)
        ).to.be.revertedWith("Subscription is not active");
        
        console.log("  ✅ Cannot process payments on auto-cancelled subscriptions");
      });
    });
  });
  
  // ========================================
  // SUBSCRIPTION CANCELLATION TESTS
  // ========================================
  
  describe("Subscription Cancellation", function () {
    const NETFLIX_ID = 1;
    let cancelTestSubId: bigint;
    
    before(async function () {
      // Register Netflix as a provider for these tests
      await subChainContract.connect(owner).registerServiceProvider(
        NETFLIX_ID,
        serviceProvider.address,
        0 // PaymentType.DirectCrypto
      );
      
      // Fund and approve for user1
      await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
      await pyusdContract.connect(user1).approve(
        await subChainContract.getAddress(),
        ethers.parseUnits("10000", 6)
      );
      
      // Create a test subscription for cancellation tests
      const amount = ethers.parseUnits("20", 6);
      const interval = THIRTY_DAYS;
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix Cancel Test",
        0,
        0,
        false
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      cancelTestSubId = parsedEvent!.args[0];
    });
    
    describe("User Cancellation", function () {
      it("Should allow user to cancel their own subscription", async function () {
        // Verify subscription is active before cancellation
        let sub = await subChainContract.getSubscription(cancelTestSubId);
        expect(sub.isActive).to.be.true;
        
        // Cancel subscription
        const tx = await subChainContract.connect(user1).cancelSubscription(cancelTestSubId);
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt!.blockNumber);
        
        // Verify SubscriptionCancelled event was emitted
        await expect(tx).to.emit(subChainContract, "SubscriptionCancelled")
          .withArgs(
            cancelTestSubId,
            user1.address,
            NETFLIX_ID,
            block!.timestamp,
            "user_cancelled"
          );
        
        // Verify subscription is now inactive
        sub = await subChainContract.getSubscription(cancelTestSubId);
        expect(sub.isActive).to.be.false;
        
        console.log("  ✅ User successfully cancelled their subscription");
        console.log("  📊 Subscription is now inactive");
      });
      
      it("Should revert if user tries to cancel already cancelled subscription", async function () {
        // Try to cancel the same subscription again
        await expect(
          subChainContract.connect(user1).cancelSubscription(cancelTestSubId)
        ).to.be.revertedWith("Subscription already cancelled");
      });
      
      it("Should revert if non-owner tries to cancel subscription", async function () {
        // Create a new subscription by user1
        const amount = ethers.parseUnits("15", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Non-Owner Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const newSubId = parsedEvent!.args[0];
        
        // User2 tries to cancel user1's subscription - should fail
        await expect(
          subChainContract.connect(user2).cancelSubscription(newSubId)
        ).to.be.revertedWith("Only subscriber can cancel");
        
        console.log("  ✅ Non-owner cannot cancel another user's subscription");
      });
      
      it("Should revert when trying to cancel non-existent subscription", async function () {
        await expect(
          subChainContract.connect(user1).cancelSubscription(99999)
        ).to.be.revertedWith("Subscription does not exist");
      });
      
      it("Should prevent payment processing after user cancellation", async function () {
        // Create a new subscription
        const amount = ethers.parseUnits("25", 6);
        const interval = THIRTY_DAYS;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix Cancel Then Pay Test",
          0,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const payTestSubId = parsedEvent!.args[0];
        
        // Cancel it
        await subChainContract.connect(user1).cancelSubscription(payTestSubId);
        
        // Fast-forward time so payment would be due
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Try to process payment - should fail
        await expect(
          subChainContract.processPayment(payTestSubId)
        ).to.be.revertedWith("Subscription is not active");
        
        console.log("  ✅ Cannot process payments on user-cancelled subscriptions");
      });
    });
    
    describe("Auto-Cancellation Scenarios", function () {
      it("Should auto-cancel when endDate is reached", async function () {
        // Create subscription with endDate in near future
        const amount = ethers.parseUnits("10", 6);
        const interval = THIRTY_DAYS;
        const currentBlock = await ethers.provider.getBlock("latest");
        const endDate = currentBlock!.timestamp + (5 * ONE_DAY); // 5 days from now
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix EndDate Test",
          endDate,
          0,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const endDateSubId = parsedEvent!.args[0];
        
        // Fast-forward past endDate (30 days is more than 5 days)
        await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
        await ethers.provider.send("evm_mine", []);
        
        // Try to process payment - should auto-cancel due to endDate
        const processTx = await subChainContract.processPayment(endDateSubId);
        
        // Verify SubscriptionCancelled event was emitted
        await expect(processTx).to.emit(subChainContract, "SubscriptionCancelled")
          .withArgs(
            endDateSubId,
            user1.address,
            NETFLIX_ID,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp),
            "expired_end_date"
          );
        
        // Verify subscription is inactive
        const sub = await subChainContract.getSubscription(endDateSubId);
        expect(sub.isActive).to.be.false;
        
        console.log("  ✅ Subscription auto-cancelled when endDate reached");
      });
      
      it("Should auto-cancel when maxPayments is reached", async function () {
        // Re-fund user1 to ensure sufficient balance
        await fundAccountWithPyusd(user1.address, ethers.parseUnits("1000", 6));
        await pyusdContract.connect(user1).approve(
          await subChainContract.getAddress(),
          ethers.parseUnits("10000", 6)
        );
        
        // Create subscription with maxPayments = 1 (simplest case)
        // This will process 1 payment successfully, then 2nd attempt will trigger maxPayments limit
        const amount = ethers.parseUnits("10", 6);
        const interval = ONE_DAY;
        const maxPayments = 1;
        
        const tx = await subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Netflix MaxPayments Test",
          0, // Let contract auto-calculate endDate from maxPayments
          maxPayments,
          false
        );
        
        const receipt = await tx.wait();
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        const maxPaySubId = parsedEvent!.args[0];
        
        let sub = await subChainContract.getSubscription(maxPaySubId);
        
        // Process first (and only allowed) payment
        await ethers.provider.send("evm_increaseTime", [ONE_DAY]); // Full day for payment to be due
        await ethers.provider.send("evm_mine", []);
        await subChainContract.processPayment(maxPaySubId);
        
        sub = await subChainContract.getSubscription(maxPaySubId);
        expect(sub.paymentCount).to.equal(1);
        expect(sub.isActive).to.be.true;
        
        // Try to process second payment - should auto-cancel because maxPayments (1) reached
        await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
        await ethers.provider.send("evm_mine", []);
        const secondPayment = await subChainContract.processPayment(maxPaySubId);
        
        // Verify SubscriptionCancelled event was emitted with correct reason
        await expect(secondPayment).to.emit(subChainContract, "SubscriptionCancelled")
          .withArgs(
            maxPaySubId,
            user1.address,
            NETFLIX_ID,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp),
            "expired_max_payments"
          );
        
        // Verify subscription is inactive
        sub = await subChainContract.getSubscription(maxPaySubId);
        expect(sub.isActive).to.be.false;
        expect(sub.paymentCount).to.equal(1); // Should have processed exactly 1 payment
        
        console.log("  ✅ Subscription auto-cancelled when maxPayments reached");
        console.log("  📊 Final payment count:", sub.paymentCount.toString());
      });
    });
  });
  
  // ========================================
  // VIEW FUNCTIONS TESTS
  // ========================================
  
  describe("View Functions", function () {
    // Test 3.14: All getters return correct data
    // getSubscription, getUserSubscriptions, getProviderAddress, etc.
  });
  
  // ========================================
  // AUTOMATION HELPERS TESTS
  // ========================================
  
  describe("Automation Helpers", function () {
    // Test 3.17: getPaymentsDue - returns correct IDs
    // Test 3.18: getPaymentsDue - multiple due subscriptions
  });
  
  // ========================================
  // EVENT EMISSION TESTS
  // ========================================
  
  describe("Event Emissions", function () {
    // Test 3.15: Verify all events emit correct parameters
    // SubscriptionCreated, PaymentProcessed, PaymentFailed, SubscriptionCancelled
  });
  
  // ========================================
  // EDGE CASES & SCENARIOS
  // ========================================
  
  describe("Edge Cases", function () {
    // Test 3.16: Multiple subscriptions by same user to same service
    // Payment count tracking with maxPayments
    // EndDate expiry scenarios
    // Provider type restrictions
  });
});

