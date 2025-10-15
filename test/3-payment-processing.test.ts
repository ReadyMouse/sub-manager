import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS, fundAccountWithPyusd } from "./helpers/setup";

describe("SubChainSubscription - Payment Processing", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SERVICE_PROVIDER_ID = 100;
  let testSubscriptionId: bigint;
  
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
      NETFLIX_ID, // senderId
      SERVICE_PROVIDER_ID, // recipientId
      amount,
      interval,
      "Netflix Test Sub",
      0,
      0,
      serviceProvider.address, // recipientAddress
      "PYUSD", // senderCurrency
      "PYUSD" // recipientCurrency
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
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          ethers.parseUnits("50", 6),
          1, // paymentCount
          block!.timestamp,
          block!.timestamp + THIRTY_DAYS // nextPaymentDue
        );
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
    });
    
    it("Should reset failedPaymentCount on successful payment", async function () {
      // Create a new subscription that will have a failed payment first
      const amount = ethers.parseUnits("20", 6);
      const interval = THIRTY_DAYS;
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Reset Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
    });
  });
  
  describe("Payment Processing - Revert Cases", function () {
    it("Should revert if payment not yet due", async function () {
      // Create a fresh subscription
      const amount = ethers.parseUnits("10", 6);
      const interval = THIRTY_DAYS;
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Not Due Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Inactive Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
    });
  });
  
  describe("Failed Payment Handling", function () {
    it("Should handle payment with insufficient balance", async function () {
      // Create subscription
      const amount = ethers.parseUnits("100", 6); // 100 PYUSD
      const interval = THIRTY_DAYS;
      
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Insufficient Balance Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Insufficient Allowance Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Consecutive Failures Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Auto-Cancel Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
      
      // Verify SubscriptionCancelled event was emitted with correct reason
      await expect(thirdAttempt).to.emit(subChainContract, "SubscriptionCancelled")
        .withArgs(
          autoCancelSubId,
          user1.address,
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          await ethers.provider.getBlock("latest").then(b => b!.timestamp),
          "auto_cancelled_failures"
        );
      
      // Verify subscription is inactive
      sub = await subChainContract.getSubscription(autoCancelSubId);
      expect(sub.isActive).to.be.false;
      expect(sub.failedPaymentCount).to.equal(3);
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Auto-Cancel Verify Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
    });
    
    it("Should auto-cancel subscription after 3 consecutive failed payments due to insufficient allowance", async function () {
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
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        amount,
        interval,
        "Netflix Allowance Auto-Cancel Test",
        0,
        0,
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD" // recipientCurrency
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
      const allowanceSubId = parsedEvent!.args[0];
      
      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      // Revoke allowance (user still has balance, but no allowance)
      await pyusdContract.connect(user1).approve(
        await subChainContract.getAddress(),
        0
      );
      
      // First payment failure due to insufficient allowance
      await subChainContract.processPayment(allowanceSubId);
      
      let sub = await subChainContract.getSubscription(allowanceSubId);
      expect(sub.failedPaymentCount).to.equal(1);
      expect(sub.isActive).to.be.true;
      
      // Second payment failure
      await subChainContract.processPayment(allowanceSubId);
      
      sub = await subChainContract.getSubscription(allowanceSubId);
      expect(sub.failedPaymentCount).to.equal(2);
      expect(sub.isActive).to.be.true;
      
      // Third payment failure - should auto-cancel
      const thirdAttempt = await subChainContract.processPayment(allowanceSubId);
      
      // Verify SubscriptionCancelled event was emitted with correct reason
      await expect(thirdAttempt).to.emit(subChainContract, "SubscriptionCancelled")
        .withArgs(
          allowanceSubId,
          user1.address,
          NETFLIX_ID, // senderId
          SERVICE_PROVIDER_ID, // recipientId
          await ethers.provider.getBlock("latest").then(b => b!.timestamp),
          "auto_cancelled_failures"
        );
      
      // Verify subscription is inactive
      sub = await subChainContract.getSubscription(allowanceSubId);
      expect(sub.isActive).to.be.false;
      expect(sub.failedPaymentCount).to.equal(3);
    });
  });
});
