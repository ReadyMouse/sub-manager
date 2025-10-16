import { expect } from "chai";
import { ethers } from "hardhat";
import { StableRentSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS, DEFAULT_PROCESSOR_FEE, PROCESSOR_FEE_ID } from "./helpers/setup";

describe("StableRentSubscription - Subscription Cancellation", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SERVICE_PROVIDER_ID = 100;
  let cancelTestSubId: bigint;
  
  let stableRentContract: StableRentSubscription;
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
    ({ stableRentContract, pyusdContract, owner, user1, user2, serviceProvider, landlord } = 
      await setupTestContracts());
    
    // Create a test subscription for cancellation tests
    const amount = ethers.parseUnits("20", 6);
    const interval = THIRTY_DAYS;
    
    // Approve PYUSD
    await pyusdContract.connect(user1).approve(
      await stableRentContract.getAddress(),
      ethers.parseUnits("10000", 6)
    );
    
    // Create subscription
    const tx = await stableRentContract.connect(user1).createSubscription(
      NETFLIX_ID, // senderId
      SERVICE_PROVIDER_ID, // recipientId
      amount,
      interval,
      "Netflix Cancel Test",
      0,
      0,
      serviceProvider.address, // recipientAddress
      "PYUSD", // senderCurrency
      "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
    
    const receipt = await tx.wait();
    const event = receipt?.logs.find(log => {
      try {
        return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
      } catch {
        return false;
      }
    });
    
    const parsedEvent = stableRentContract.interface.parseLog(event!);
    cancelTestSubId = parsedEvent!.args[0];
  });
  
  describe("User Cancellation", function () {
    it("Should allow user to cancel their own subscription", async function () {
      // Verify subscription is active before cancellation
      let sub = await stableRentContract.getSubscription(cancelTestSubId);
      expect(sub.isActive).to.be.true;
      
      // Cancel subscription
      const tx = await stableRentContract.connect(user1).cancelSubscription(cancelTestSubId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      // Verify SubscriptionCancelled event was emitted
      await expect(tx).to.emit(stableRentContract, "SubscriptionCancelled")
        .withArgs(
          cancelTestSubId,
          user1.address,
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          block!.timestamp,
          "user_cancelled"
        );
      
      // Verify subscription is now inactive
      sub = await stableRentContract.getSubscription(cancelTestSubId);
      expect(sub.isActive).to.be.false;
    });
    
    it("Should revert if user tries to cancel already cancelled subscription", async function () {
      // Try to cancel the same subscription again
      await expect(
        stableRentContract.connect(user1).cancelSubscription(cancelTestSubId)
      ).to.be.revertedWith("Subscription already cancelled");
    });
    
    it("Should revert if non-owner tries to cancel subscription", async function () {
      // Create a new subscription by user1
      const amount = ethers.parseUnits("15", 6);
      const interval = THIRTY_DAYS;
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Non-Owner Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = stableRentContract.interface.parseLog(event!);
      const newSubId = parsedEvent!.args[0];
      
      // User2 tries to cancel user1's subscription - should fail
      await expect(
        stableRentContract.connect(user2).cancelSubscription(newSubId)
      ).to.be.revertedWith("Only sender can cancel");
    });
    
    it("Should revert when trying to cancel non-existent subscription", async function () {
      await expect(
        stableRentContract.connect(user1).cancelSubscription(99999)
      ).to.be.revertedWith("Subscription does not exist");
    });
    
    it("Should prevent payment processing after user cancellation", async function () {
      // Create a new subscription
      const amount = ethers.parseUnits("25", 6);
      const interval = THIRTY_DAYS;
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Cancel Then Pay Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = stableRentContract.interface.parseLog(event!);
      const payTestSubId = parsedEvent!.args[0];
      
      // Cancel it
      await stableRentContract.connect(user1).cancelSubscription(payTestSubId);
      
      // Fast-forward time so payment would be due
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - should fail
      await expect(
        stableRentContract.processPayment(payTestSubId)
      ).to.be.revertedWith("Subscription is not active");
    });
  });
  
  describe("Auto-Cancellation Scenarios", function () {
    it("Should auto-cancel when endDate is reached", async function () {
      // Create subscription with endDate in near future
      const amount = ethers.parseUnits("10", 6);
      const interval = THIRTY_DAYS;
      const currentBlock = await ethers.provider.getBlock("latest");
      const endDate = currentBlock!.timestamp + (5 * ONE_DAY); // 5 days from now
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix EndDate Test",
        endDate,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = stableRentContract.interface.parseLog(event!);
      const endDateSubId = parsedEvent!.args[0];
      
      // Fast-forward past endDate (30 days is more than 5 days)
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - should auto-cancel due to endDate
      const processTx = await stableRentContract.processPayment(endDateSubId);
      
      // Verify SubscriptionCancelled event was emitted
      await expect(processTx).to.emit(stableRentContract, "SubscriptionCancelled")
        .withArgs(
          endDateSubId,
          user1.address,
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          await ethers.provider.getBlock("latest").then(b => b!.timestamp),
          "expired_end_date"
        );
      
      // Verify subscription is inactive
      const sub = await stableRentContract.getSubscription(endDateSubId);
      expect(sub.isActive).to.be.false;
    });
    
    it("Should auto-cancel when maxPayments is reached", async function () {
      // Create subscription with maxPayments = 2 and 1-day interval
      // We'll use a shorter interval and advance time in smaller increments
      const amount = ethers.parseUnits("10", 6);
      const interval = ONE_DAY; // 1 day
      const maxPayments = 2;
      
      // Get current block timestamp
      const startBlock = await ethers.provider.getBlock("latest");
      const startTime = startBlock!.timestamp;
      
      // Calculate endDate to be after maxPayments * interval
      // This ensures we hit maxPayments before endDate
      const endDate = startTime + (maxPayments * interval) + (7 * ONE_DAY); // Add 7 days to avoid timing issues
      
      // Create subscription with maxPayments = 2 and endDate far in future
      // This ensures we hit maxPayments before endDate
      const tx = await stableRentContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix MaxPayments Test",
        endDate, // Set explicit endDate far in future
        maxPayments,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      // Get subscription state to see what endDate the contract calculated
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = stableRentContract.interface.parseLog(event!);
      const calculatedEndDate = parsedEvent!.args[6]; // endDate from event
      
      // Create subscription again with endDate = calculatedEndDate + 7 days
      // This ensures we hit maxPayments before endDate
      const tx2 = await stableRentContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix MaxPayments Test",
        Number(calculatedEndDate) + (7 * ONE_DAY), // Set endDate far after the contract's calculated endDate
        maxPayments,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs.find(log => {
        try {
          return stableRentContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent2 = stableRentContract.interface.parseLog(event2!);
      const maxPaySubId = parsedEvent2!.args[0];
      
      // Get subscription state to see when first payment is due
      let sub = await stableRentContract.getSubscription(maxPaySubId);
      console.log("    Initial subscription state:");
      console.log("      nextPaymentDue:", sub.nextPaymentDue.toString());
      console.log("      paymentCount:", sub.paymentCount.toString());
      console.log("      maxPayments:", sub.maxPayments.toString());
      console.log("      endDate:", sub.endDate.toString());
      
      // Process first payment
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]); // 1 day + 1 second
      await ethers.provider.send("evm_mine", []);
      const block1 = await ethers.provider.getBlock("latest");
      console.log("    Attempting first payment at:", block1!.timestamp);
      const firstPayment = await stableRentContract.processPayment(maxPaySubId);
      const firstReceipt = await firstPayment.wait();
      
      // Check what events were emitted
      const firstEvents = firstReceipt?.logs.map(log => {
        try {
          const parsed = stableRentContract.interface.parseLog(log);
          return parsed?.name;
        } catch {
          return null;
        }
      }).filter(Boolean);
      console.log("    First payment events:", firstEvents);
      
      sub = await stableRentContract.getSubscription(maxPaySubId);
      console.log("    After first payment:");
      console.log("      paymentCount:", sub.paymentCount.toString());
      console.log("      nextPaymentDue:", sub.nextPaymentDue.toString());
      expect(sub.paymentCount).to.equal(1);
      expect(sub.isActive).to.be.true;
      
      // Process second payment
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]); // 1 day + 1 second
      await ethers.provider.send("evm_mine", []);
      const block2 = await ethers.provider.getBlock("latest");
      console.log("    Attempting second payment at:", block2!.timestamp);
      const secondPayment = await stableRentContract.processPayment(maxPaySubId);
      const secondReceipt = await secondPayment.wait();
      
      // Check what events were emitted
      const secondEvents = secondReceipt?.logs.map(log => {
        try {
          const parsed = stableRentContract.interface.parseLog(log);
          return parsed?.name;
        } catch {
          return null;
        }
      }).filter(Boolean);
      console.log("    Second payment events:", secondEvents);
      
      sub = await stableRentContract.getSubscription(maxPaySubId);
      console.log("    After second payment:");
      console.log("      paymentCount:", sub.paymentCount.toString());
      console.log("      nextPaymentDue:", sub.nextPaymentDue.toString());
      expect(sub.paymentCount).to.equal(2);
      expect(sub.isActive).to.be.true;
      
      // Try to process third payment - should auto-cancel because maxPayments (2) reached
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]); // 1 day + 1 second
      await ethers.provider.send("evm_mine", []);
      const block3 = await ethers.provider.getBlock("latest");
      console.log("    Attempting third payment at:", block3!.timestamp);
      const thirdPayment = await stableRentContract.processPayment(maxPaySubId);
      
      // Verify SubscriptionCancelled event was emitted with correct reason
      await expect(thirdPayment).to.emit(stableRentContract, "SubscriptionCancelled")
        .withArgs(
          maxPaySubId,
          user1.address,
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          await ethers.provider.getBlock("latest").then(b => b!.timestamp),
          "expired_max_payments"
        );
      
      // Verify subscription is inactive
      sub = await stableRentContract.getSubscription(maxPaySubId);
      expect(sub.isActive).to.be.false;
      expect(sub.paymentCount).to.equal(2); // Should have processed exactly 2 payments
    });
  });
});
