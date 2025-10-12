import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS, fundAccountWithPyusd } from "./helpers/setup";

describe("SubChainSubscription - Subscription Creation", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  let subscriptionId: bigint;
  
  let subChainContract: SubChainSubscription;
  let pyusdContract: IERC20Metadata;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let serviceProvider: HardhatEthersSigner;
  let landlord: HardhatEthersSigner;
  
  // ========================================
  // SETUP
  // ========================================
  
  before(async function () {
    // Get contracts and signers
    ({ subChainContract, pyusdContract, owner, user1, user2, serviceProvider, landlord } = 
      await setupTestContracts());
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
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency (empty = PYUSD)
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address, // recipientAddress
          "", // recipientCurrency
          block!.timestamp
        );
    });
    
    it("Should verify subscription data is stored correctly", async function () {
      const sub = await subChainContract.getSubscription(subscriptionId);
      
      expect(sub.id).to.equal(subscriptionId);
      expect(sub.subscriber).to.equal(user1.address);
      expect(sub.serviceProviderId).to.equal(NETFLIX_ID);
      expect(sub.amount).to.equal(ethers.parseUnits("10", 6));
      expect(sub.interval).to.equal(THIRTY_DAYS);
      expect(sub.isActive).to.be.true;
      expect(sub.paymentType).to.equal(2); // DirectRecipientWallet
      expect(sub.providerType).to.equal(0); // PublicVerified
      expect(sub.recipientAddress).to.equal(serviceProvider.address);
      expect(sub.recipientCurrency).to.equal("");
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
      
      // Fast forward a bit to ensure endDate is in future when tx is mined
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix Premium Annual",
        endDate,
        0, // maxPayments = 0 (unlimited, but limited by endDate)
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency
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
      expect(sub.endDate).to.equal(endDate);
      expect(sub.maxPayments).to.equal(0);
    });
    
    it("Should create subscription with maxPayments only (no endDate)", async function () {
      const amount = ethers.parseUnits("15", 6); // 15 PYUSD
      const interval = THIRTY_DAYS;
      const maxPayments = 12; // 12 payments
      
      // Fast forward a bit to ensure timestamps are fresh
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix 12-Month Plan",
        0, // endDate = 0 (unlimited, but limited by maxPayments)
        maxPayments,
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency
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
      expect(sub.maxPayments).to.equal(maxPayments);
      
      // Verify endDate is set
      expect(sub.endDate).to.be.gt(0);
      
      // Verify we can process maxPayments payments before endDate
      let paymentCount = 0;
      while (paymentCount < maxPayments) {
        // Fast forward to next payment
        await ethers.provider.send("evm_increaseTime", [interval]);
        await ethers.provider.send("evm_mine", []);
        
        // Process payment
        await subChainContract.processPayment(newSubId);
        
        // Verify payment was processed
        const updatedSub = await subChainContract.getSubscription(newSubId);
        paymentCount++;
        expect(updatedSub.paymentCount).to.equal(paymentCount);
      }
      
      // Verify subscription is still active
      const finalSub = await subChainContract.getSubscription(newSubId);
      expect(finalSub.isActive).to.be.true;
    });
    
    it("Should create subscription with both endDate and maxPayments (earlier limit applies)", async function () {
      const amount = ethers.parseUnits("25", 6); // 25 PYUSD
      const interval = THIRTY_DAYS;
      const maxPayments = 6; // 6 payments (6 months)
      
      // Get current block timestamp
      const block = await ethers.provider.getBlock("latest");
      const startTime = block!.timestamp;
      
      // Set endDate far in the future (1 year)
      const endDate = startTime + (365 * ONE_DAY);
      
      // Calculate expected endDate based on maxPayments
      // Contract uses: now + (maxPayments + 1) * interval
      const expectedEndDate = startTime + ((maxPayments + 1) * interval);
      
      // Fast forward a bit to ensure timestamps are fresh
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix Flexible Plan",
        endDate,
        maxPayments,
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency
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
      
      // Verify endDate is set
      expect(sub.endDate).to.be.gt(0);
      expect(sub.endDate).to.be.lt(endDate); // Should be earlier than provided endDate
      
      // Get block timestamp after tx
      const txBlock = await ethers.provider.getBlock(receipt!.blockNumber);
      
      // Calculate expected endDate based on actual tx timestamp
      const calculatedEndDate = txBlock!.timestamp + ((maxPayments + 1) * interval);
      
      // Verify endDate matches contract's calculation
      expect(sub.endDate).to.equal(calculatedEndDate);
      expect(sub.maxPayments).to.equal(maxPayments);
      
      // Verify we can process maxPayments payments before endDate
      let paymentCount = 0;
      while (paymentCount < maxPayments) {
        // Fast forward to next payment
        await ethers.provider.send("evm_increaseTime", [interval]);
        await ethers.provider.send("evm_mine", []);
        
        // Process payment
        await subChainContract.processPayment(newSubId);
        
        // Verify payment was processed
        const updatedSub = await subChainContract.getSubscription(newSubId);
        paymentCount++;
        expect(updatedSub.paymentCount).to.equal(paymentCount);
      }
      
      // Verify subscription is still active
      const finalSub = await subChainContract.getSubscription(newSubId);
      expect(finalSub.isActive).to.be.true;
      expect(sub.maxPayments).to.equal(maxPayments);
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
        2, // PaymentType.DirectRecipientWallet
        2, // ProviderType.Private
        landlord.address, // recipientAddress (private recipient)
        "" // recipientCurrency
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
      expect(sub.providerType).to.equal(2); // Private
    });
    
    it("Should allow multiple subscriptions from same user to same provider", async function () {
      const amount = ethers.parseUnits("5", 6);
      const interval = THIRTY_DAYS;
      
      // Get current subscription count
      const beforeSubs = await subChainContract.getUserSubscriptions(user1.address);
      const beforeCount = beforeSubs.length;
      
      // Create another subscription to Netflix
      await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID,
        amount,
        interval,
        "Netflix Basic",
        0,
        0,
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency
      );
      
      const afterSubs = await subChainContract.getUserSubscriptions(user1.address);
      
      // User1 should have one more subscription than before
      expect(afterSubs.length).to.equal(beforeCount + 1);
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
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        serviceProvider.address, // recipientAddress
        "" // recipientCurrency
      );
      
      const user2Subs = await subChainContract.getUserSubscriptions(user2.address);
      expect(user2Subs.length).to.equal(1);
    });
  });
  
  describe("Revert Cases - Invalid Parameters", function () {
    const amount = ethers.parseUnits("10", 6);
    const interval = THIRTY_DAYS;
    
    it("Should revert if recipient address is not provided", async function () {
      await expect(
        subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Test Service",
          0,
          0,
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          ethers.ZeroAddress, // Invalid recipient address
          "" // recipientCurrency
        )
      ).to.be.revertedWith("Recipient address required");
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
        )
      ).to.be.revertedWith("Service name too long");
    });
    
    it("Should revert if recipient currency ticker is too long", async function () {
      const longTicker = "A".repeat(11); // 11 characters (max is 10)
      
      await expect(
        subChainContract.connect(user1).createSubscription(
          NETFLIX_ID,
          amount,
          interval,
          "Test Service",
          0,
          0,
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          longTicker // Too long
        )
      ).to.be.revertedWith("Recipient currency ticker too long");
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
      
      // Fast forward a bit to ensure timestamps are fresh
      await ethers.provider.send("evm_increaseTime", [1]);
      await ethers.provider.send("evm_mine", []);
      
      // Verify balance is actually 5 PYUSD
      const balance = await pyusdContract.balanceOf(poorUser.address);
      expect(balance).to.equal(ethers.parseUnits("5", 6));
      
      await expect(
        subChainContract.connect(poorUser).createSubscription(
          NETFLIX_ID,
          ethers.parseUnits("10", 6), // More than balance
          interval,
          "Netflix Premium",
          0,
          0,
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
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
          2, // PaymentType.DirectRecipientWallet
          0, // ProviderType.PublicVerified
          serviceProvider.address,
          ""
        )
      ).to.be.revertedWith("Insufficient PYUSD allowance - approve contract to spend PYUSD");
    });
  });
});
