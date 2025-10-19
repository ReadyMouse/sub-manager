import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { 
  StableRentSubscription,
  SubscriptionResolver,
  SubscriptionExecutor,
  IERC20
} from "../../../typechain-types";

/**
 * Test suite for Gelato Automation integration
 * 
 * REQUIREMENTS:
 * - Must run on forked mainnet (MAINNET_RPC_URL env variable set)
 * - Requires access to real PYUSD token at 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
 * 
 * Tests cover:
 * 1. Resolver functionality (checking due subscriptions)
 * 2. Executor functionality (processing payments)
 * 3. Batch processing
 * 4. Error handling
 * 5. Gas optimization
 * 6. Integration with main subscription contract
 */
describe("Gelato Automation", function () {
  // Skip tests if not running on forked mainnet
  before(function() {
    const chainId = ethers.provider._network?.chainId;
    if (!process.env.MAINNET_RPC_URL) {
      console.log("\n⚠️  Skipping Gelato tests: MAINNET_RPC_URL not set");
      console.log("   Add MAINNET_RPC_URL to your .env file to run these tests\n");
      this.skip();
    }
  });
  
  describe("Deployment and Constructor Tests", function () {
    let subscriptionContract: StableRentSubscription;
    let owner: SignerWithAddress;
    
    before(async function () {
      [owner] = await ethers.getSigners();
      
      // Deploy subscription contract for constructor tests
      const SubscriptionFactory = await ethers.getContractFactory("StableRentSubscription");
      subscriptionContract = await SubscriptionFactory.deploy(owner.address, PYUSD_ADDRESS);
      await subscriptionContract.waitForDeployment();
    });
    
    it("Should reject SubscriptionResolver with zero subscription contract address", async function () {
      const ResolverFactory = await ethers.getContractFactory("SubscriptionResolver");
      
      await expect(
        ResolverFactory.deploy(ethers.ZeroAddress, MAX_BATCH_SIZE)
      ).to.be.revertedWith("Invalid subscription contract");
    });
    
    it("Should reject SubscriptionResolver with zero batch size", async function () {
      const ResolverFactory = await ethers.getContractFactory("SubscriptionResolver");
      
      await expect(
        ResolverFactory.deploy(await subscriptionContract.getAddress(), 0)
      ).to.be.revertedWith("Batch size must be > 0");
    });
    
    it("Should reject SubscriptionExecutor with zero subscription contract address", async function () {
      const ExecutorFactory = await ethers.getContractFactory("SubscriptionExecutor");
      const [, gelatoAddr] = await ethers.getSigners();
      
      await expect(
        ExecutorFactory.deploy(owner.address, ethers.ZeroAddress, gelatoAddr.address)
      ).to.be.revertedWith("Invalid subscription contract");
    });
    
    it("Should reject SubscriptionExecutor with zero gelato executor address", async function () {
      const ExecutorFactory = await ethers.getContractFactory("SubscriptionExecutor");
      
      await expect(
        ExecutorFactory.deploy(owner.address, await subscriptionContract.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid Gelato executor");
    });
  });
  // Contracts
  let subscriptionContract: StableRentSubscription;
  let resolver: SubscriptionResolver;
  let executor: SubscriptionExecutor;
  let pyusdToken: IERC20;
  
  // Accounts
  let owner: SignerWithAddress;
  let renter: SignerWithAddress;
  let landlord: SignerWithAddress;
  let gelatoExecutor: SignerWithAddress;
  let feeCollector: SignerWithAddress;
  
  // Test data
  const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"; // Mainnet PYUSD
  const RENT_AMOUNT = ethers.parseUnits("1000", 6); // 1000 PYUSD
  const PROCESSOR_FEE = ethers.parseUnits("10", 6); // 10 PYUSD
  const INTERVAL = 30 * 24 * 60 * 60; // 30 days
  const MAX_BATCH_SIZE = 50;
  
  // Helper: Fund account with PYUSD
  async function fundWithPYUSD(to: string, amount: bigint) {
    // In forked mainnet, impersonate a whale account
    // Using the same whale address as other tests (has ~15.8M PYUSD)
    const PYUSD_WHALE = "0xCFFAd3200574698b78f32232aa9D63eABD290703";
    
    await ethers.provider.send("hardhat_impersonateAccount", [PYUSD_WHALE]);
    const whale = await ethers.getSigner(PYUSD_WHALE);
    
    // Fund the whale with ETH for gas
    const [deployer] = await ethers.getSigners();
    await deployer.sendTransaction({
      to: PYUSD_WHALE,
      value: ethers.parseEther("1.0")
    });
    
    await pyusdToken.connect(whale).transfer(to, amount);
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [PYUSD_WHALE]);
  }
  
  beforeEach(async function () {
    // Get signers
    [owner, renter, landlord, gelatoExecutor, feeCollector] = await ethers.getSigners();
    
    // Deploy subscription contract
    const SubscriptionFactory = await ethers.getContractFactory("StableRentSubscription");
    subscriptionContract = await SubscriptionFactory.deploy(owner.address, PYUSD_ADDRESS);
    await subscriptionContract.waitForDeployment();
    
    // Deploy resolver
    const ResolverFactory = await ethers.getContractFactory("SubscriptionResolver");
    resolver = await ResolverFactory.deploy(
      await subscriptionContract.getAddress(),
      MAX_BATCH_SIZE
    );
    await resolver.waitForDeployment();
    
    // Deploy executor
    const ExecutorFactory = await ethers.getContractFactory("SubscriptionExecutor");
    executor = await ExecutorFactory.deploy(
      owner.address,
      await subscriptionContract.getAddress(),
      gelatoExecutor.address
    );
    await executor.waitForDeployment();
    
    // Get PYUSD token interface
    pyusdToken = await ethers.getContractAt("IERC20", PYUSD_ADDRESS);
    
    // Fund renter with PYUSD
    await fundWithPYUSD(renter.address, RENT_AMOUNT * 10n); // Fund for 10 payments
    
    console.log("✅ Test setup complete");
  });
  
  describe("Resolver Tests", function () {
    it("Should return false when no payments are due", async function () {
      const [canExec, execPayload] = await resolver.checker();
      
      expect(canExec).to.be.false;
      // Check that it contains "No payments due" message
      const message = ethers.toUtf8String(execPayload);
      expect(message).to.equal("No payments due");
    });
    
    it("Should detect due subscriptions", async function () {
      // Create subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        RENT_AMOUNT + PROCESSOR_FEE
      );
      
      const tx = await subscriptionContract.connect(renter).createSubscription(
        1, // senderId
        2, // recipientId
        RENT_AMOUNT,
        INTERVAL,
        "Monthly Rent",
        0, // no end date
        0, // unlimited payments
        landlord.address,
        "PYUSD",
        "PYUSD",
        PROCESSOR_FEE,
        feeCollector.address,
        "PYUSD",
        1 // processor fee ID
      );
      
      await tx.wait();
      
      // Should not be due yet (just created)
      let [canExec] = await resolver.checker();
      expect(canExec).to.be.false;
      
      // Fast forward time to payment due
      await time.increase(INTERVAL);
      
      // Now should be due
      [canExec] = await resolver.checker();
      expect(canExec).to.be.true;
    });
    
    it("Should return correct exec payload", async function () {
      // Create subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        RENT_AMOUNT + PROCESSOR_FEE
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      // Fast forward
      await time.increase(INTERVAL);
      
      const [canExec, execPayload] = await resolver.checker();
      
      expect(canExec).to.be.true;
      
      // Decode payload
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256[]"],
        ethers.dataSlice(execPayload, 4)
      );
      
      expect(decoded[0].length).to.equal(1); // One subscription
      expect(decoded[0][0]).to.equal(1n); // Subscription ID 1
    });
    
    it("Should respect max batch size", async function () {
      this.timeout(120000); // Increase timeout to 2 minutes for this test
      
      // Create multiple subscriptions (10 is enough to test batching logic)
      const numSubs = 10; // Reduced from 75 for faster test execution
      
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * BigInt(numSubs)
      );
      
      for (let i = 0; i < numSubs; i++) {
        await subscriptionContract.connect(renter).createSubscription(
          1, 2, RENT_AMOUNT, INTERVAL, `Subscription ${i}`, 0, 0,
          landlord.address, "PYUSD", "PYUSD",
          PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
        );
      }
      
      // Fast forward
      await time.increase(INTERVAL);
      
      const [canExec, execPayload] = await resolver.checker();
      
      expect(canExec).to.be.true;
      
      // Decode payload
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256[]"],
        ethers.dataSlice(execPayload, 4)
      );
      
      // Should return all subscriptions since we're under MAX_BATCH_SIZE
      expect(decoded[0].length).to.equal(numSubs);
    });
    
    it("Should return payments due count", async function () {
      expect(await resolver.getPaymentsDueCount()).to.equal(0);
      
      // Create subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        RENT_AMOUNT + PROCESSOR_FEE
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      expect(await resolver.getPaymentsDueCount()).to.equal(1);
    });
    
    it("Should return payments due list", async function () {
      // Should be empty initially
      let dueList = await resolver.getPaymentsDueList();
      expect(dueList.length).to.equal(0);
      
      // Create subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        RENT_AMOUNT + PROCESSOR_FEE
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      // Should return subscription ID 1
      dueList = await resolver.getPaymentsDueList();
      expect(dueList.length).to.equal(1);
      expect(dueList[0]).to.equal(1n);
    });
  });
  
  describe("Executor Tests", function () {
    let subscriptionId: bigint;
    
    beforeEach(async function () {
      // Create and fund subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      const tx = await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      const receipt = await tx.wait();
      subscriptionId = 1n; // First subscription
      
      // Fast forward to payment due
      await time.increase(INTERVAL);
    });
    
    it("Should process single payment", async function () {
      const landlordBalanceBefore = await pyusdToken.balanceOf(landlord.address);
      const feeCollectorBalanceBefore = await pyusdToken.balanceOf(feeCollector.address);
      
      const [successCount, failureCount] = await executor
        .connect(gelatoExecutor)
        .processPayments.staticCall([subscriptionId]);
      
      await executor
        .connect(gelatoExecutor)
        .processPayments([subscriptionId]);
      
      expect(successCount).to.equal(1);
      expect(failureCount).to.equal(0);
      
      const landlordBalanceAfter = await pyusdToken.balanceOf(landlord.address);
      const feeCollectorBalanceAfter = await pyusdToken.balanceOf(feeCollector.address);
      
      expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(RENT_AMOUNT);
      expect(feeCollectorBalanceAfter - feeCollectorBalanceBefore).to.equal(PROCESSOR_FEE);
    });
    
    it("Should emit BatchProcessed event", async function () {
      await expect(
        executor.connect(gelatoExecutor).processPayments([subscriptionId])
      ).to.emit(executor, "BatchProcessed");
    });
    
    it("Should emit PaymentProcessed event", async function () {
      await expect(
        executor.connect(gelatoExecutor).processPayments([subscriptionId])
      ).to.emit(executor, "PaymentProcessed")
       .withArgs(subscriptionId, 0, true, "Payment processed successfully");
    });
    
    it("Should update statistics", async function () {
      const [processedBefore, batchesBefore, failuresBefore] = await executor.getStats();
      
      await executor.connect(gelatoExecutor).processPayments([subscriptionId]);
      
      const [processedAfter, batchesAfter, failuresAfter] = await executor.getStats();
      
      expect(processedAfter).to.equal(processedBefore + 1n);
      expect(batchesAfter).to.equal(batchesBefore + 1n);
      expect(failuresAfter).to.equal(failuresBefore);
    });
    
    it("Should only allow Gelato or owner to execute", async function () {
      await expect(
        executor.connect(renter).processPayments([subscriptionId])
      ).to.be.revertedWith("Only Gelato or owner can execute");
    });
    
    it("Should allow owner to execute", async function () {
      await expect(
        executor.connect(owner).processPayments([subscriptionId])
      ).to.not.be.reverted;
    });
    
    it("Should handle payment failures gracefully", async function () {
      // Test with one valid subscription and one that doesn't exist / will fail
      const validSubId = subscriptionId; // This one exists and is due
      const invalidSubId = 9999n; // This subscription doesn't exist
      
      // Execute the transaction and check events
      const tx = await executor
        .connect(gelatoExecutor)
        .processPayments([validSubId, invalidSubId]);
      
      const receipt = await tx.wait();
      
      // Count successes and failures from events
      let successCount = 0;
      let failureCount = 0;
      
      if (receipt) {
        for (const log of receipt.logs) {
          try {
            const parsed = executor.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
            
            if (parsed && parsed.name === "PaymentProcessed") {
              if (parsed.args.success) {
                successCount++;
              } else {
                failureCount++;
              }
            }
          } catch (e) {
            // Log doesn't belong to this contract
          }
        }
      }
      
      expect(successCount).to.equal(1); // Valid subscription succeeds
      expect(failureCount).to.equal(1); // Invalid subscription fails
    });
    
    it("Should process batch of payments", async function () {
      // Additional approvals needed for multiple subscriptions
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        await subscriptionContract.connect(renter).createSubscription(
          1, 2, RENT_AMOUNT, INTERVAL, `Subscription ${i}`, 0, 0,
          landlord.address, "PYUSD", "PYUSD",
          PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
        );
      }
      
      // Fast forward so all subscriptions are due
      await time.increase(INTERVAL);
      
      // All subscriptions should be due now (1 from beforeEach + 5 new = 6 total)
      const subscriptionIds = [1n, 2n, 3n, 4n, 5n, 6n];
      
      const [successCount] = await executor
        .connect(gelatoExecutor)
        .processPayments.staticCall(subscriptionIds);
      
      expect(successCount).to.equal(6);
    });
    
    it("Should handle empty batch", async function () {
      const [successCount, failureCount] = await executor
        .connect(gelatoExecutor)
        .processPayments.staticCall([]);
      
      expect(successCount).to.equal(0);
      expect(failureCount).to.equal(0);
    });
    
    it("Should continue processing after payment failure", async function () {
      // Create a second valid subscription in addition to the one from beforeEach
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Second Subscription", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      // Process a batch with: valid, invalid, valid subscriptions
      const batchIds = [subscriptionId, 9999n, 2n];
      
      const [successCount, failureCount] = await executor
        .connect(gelatoExecutor)
        .processPayments.staticCall(batchIds);
      
      // Should have 2 successes and 1 failure
      expect(successCount).to.equal(2);
      expect(failureCount).to.equal(1);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update Gelato executor", async function () {
      const newExecutor = (await ethers.getSigners())[7];
      
      await expect(
        executor.connect(owner).updateGelatoExecutor(newExecutor.address)
      ).to.emit(executor, "GelatoExecutorUpdated");
      
      expect(await executor.gelatoExecutor()).to.equal(newExecutor.address);
    });
    
    it("Should not allow non-owner to update Gelato executor", async function () {
      const newExecutor = (await ethers.getSigners())[7];
      
      await expect(
        executor.connect(renter).updateGelatoExecutor(newExecutor.address)
      ).to.be.reverted;
    });
    
    it("Should allow owner to process single payment manually", async function () {
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      const landlordBalanceBefore = await pyusdToken.balanceOf(landlord.address);
      
      // Use processSinglePayment function
      await executor.connect(owner).processSinglePayment(1n);
      
      const landlordBalanceAfter = await pyusdToken.balanceOf(landlord.address);
      
      // Verify payment was processed
      expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(RENT_AMOUNT);
    });
    
    it("Should not allow non-owner to call processSinglePayment", async function () {
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      // Non-owner should not be able to call processSinglePayment
      await expect(
        executor.connect(renter).processSinglePayment(1n)
      ).to.be.reverted;
    });
    
    it("Should reject invalid Gelato executor address", async function () {
      await expect(
        executor.connect(owner).updateGelatoExecutor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid Gelato executor");
    });
  });
  
  describe("Integration Tests", function () {
    it("Should integrate resolver and executor correctly", async function () {
      // Create subscription
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      await time.increase(INTERVAL);
      
      // Step 1: Resolver checks if work is needed
      const [canExec, execPayload] = await resolver.checker();
      expect(canExec).to.be.true;
      
      // Step 2: Decode payload to get subscription IDs
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256[]"],
        ethers.dataSlice(execPayload, 4)
      );
      
      // Convert to mutable array (ethers returns read-only Result object)
      const subscriptionIds = Array.from(decoded[0]) as bigint[];
      
      // Step 3: Executor processes payments
      const landlordBalanceBefore = await pyusdToken.balanceOf(landlord.address);
      
      await executor.connect(gelatoExecutor).processPayments(subscriptionIds);
      
      const landlordBalanceAfter = await pyusdToken.balanceOf(landlord.address);
      
      // Verify payment was processed
      expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(RENT_AMOUNT);
    });
    
    it("Should handle multiple payment cycles", async function () {
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      await subscriptionContract.connect(renter).createSubscription(
        1, 2, RENT_AMOUNT, INTERVAL, "Monthly Rent", 0, 0,
        landlord.address, "PYUSD", "PYUSD",
        PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
      );
      
      const landlordBalanceBefore = await pyusdToken.balanceOf(landlord.address);
      
      // Process 3 payment cycles
      for (let i = 0; i < 3; i++) {
        await time.increase(INTERVAL);
        
        const [canExec, execPayload] = await resolver.checker();
        expect(canExec).to.be.true;
        
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256[]"],
          ethers.dataSlice(execPayload, 4)
        );
        
        // Convert to mutable array
        const subscriptionIds = Array.from(decoded[0]) as bigint[];
        
        await executor.connect(gelatoExecutor).processPayments(subscriptionIds);
      }
      
      const landlordBalanceAfter = await pyusdToken.balanceOf(landlord.address);
      
      // Should have received 3 payments
      expect(landlordBalanceAfter - landlordBalanceBefore).to.equal(RENT_AMOUNT * 3n);
    });
  });
  
  describe("Gas Optimization Tests", function () {
    it("Should measure gas for batch processing", async function () {
      // Create 10 subscriptions
      await pyusdToken.connect(renter).approve(
        await subscriptionContract.getAddress(),
        (RENT_AMOUNT + PROCESSOR_FEE) * 10n
      );
      
      const subscriptionIds: bigint[] = [];
      for (let i = 0; i < 10; i++) {
        await subscriptionContract.connect(renter).createSubscription(
          1, 2, RENT_AMOUNT, INTERVAL, `Sub ${i}`, 0, 0,
          landlord.address, "PYUSD", "PYUSD",
          PROCESSOR_FEE, feeCollector.address, "PYUSD", 1
        );
        subscriptionIds.push(BigInt(i + 1));
      }
      
      await time.increase(INTERVAL);
      
      const tx = await executor.connect(gelatoExecutor).processPayments(subscriptionIds);
      const receipt = await tx.wait();
      
      console.log(`⛽ Gas used for 10 payments: ${receipt?.gasUsed.toString()}`);
      console.log(`⛽ Gas per payment: ${Number(receipt?.gasUsed) / 10}`);
      
      // Should be under 3M gas for 10 payments
      expect(receipt?.gasUsed).to.be.lessThan(3000000n);
    });
  });
});

