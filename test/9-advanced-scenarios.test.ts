import { expect } from "chai";
import { ethers } from "hardhat";
import { StableRentSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, fundAccountWithPyusd } from "./helpers/setup";

describe("StableRentSubscription - Advanced Scenarios", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
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
  });
  
  describe("Complex Subscription Scenarios", function () {
    it("Should handle subscription with both endDate and maxPayments (endDate comes first)", async function () {
      const currentTime = await ethers.provider.getBlock("latest").then(block => block!.timestamp);
      const endDate = currentTime + 60 * 60 * 24 * 15; // 1 hour from now
      const maxPayments = 5;
      
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        86400, // 1 day interval (minimum allowed)
        "Short Duration Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        endDate, // endDate (15 days)
        maxPayments, // maxPayments (5)
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to endDate
      await ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 15]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - should be cancelled due to endDate
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(1)
      ).to.be.revertedWith("Subscription is not active");
    });
    
    it("Should handle subscription with both endDate and maxPayments (maxPayments comes first)", async function () {
      const currentTime = await ethers.provider.getBlock("latest").then(block => block!.timestamp);
      const endDate = currentTime + 60 * 60 * 24 * 30; // 30 days from now
      const maxPayments = 2;
      
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        2, // senderId
        2, // recipientId
        ethers.parseUnits("10", 6), // amount
        86400, // 1 day interval (minimum allowed)
        "Max Payments Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        endDate, // endDate (30 days)
        maxPayments, // maxPayments (2)
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Process 2 payments (reaching maxPayments)
      for (let i = 0; i < maxPayments; i++) {
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);
        
        await stableRentContract.connect(serviceProvider).processPayment(2);
      }
      
      // Try to process third payment - should be cancelled due to maxPayments
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(2)
      ).to.be.revertedWith("Subscription is not active");
    });
    
    it("Should handle subscription cancellation during payment processing", async function () {
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        3, // senderId
        3, // recipientId
        ethers.parseUnits("10", 6), // amount
        86400, // 1 day interval (minimum allowed)
        "Cancellation Test Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      // Cancel subscription before processing payment
      await stableRentContract.connect(user1).cancelSubscription(3);
      
      // Try to process payment - should fail
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(3)
      ).to.be.revertedWith("Subscription is not active");
    });
  });
  
  describe("Payment Processing Edge Cases", function () {
    it("Should handle payment processing with exact allowance", async function () {
      const amount = ethers.parseUnits("10", 6);
      const processorFee = ethers.parseUnits("0.5", 6);
      const totalNeeded = amount + processorFee;
      
      // Approve exact amount needed
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), totalNeeded);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        4, // senderId
        4, // recipientId
        amount, // amount
        86400, // 1 day interval (minimum allowed)
        "Exact Allowance Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        processorFee, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      // Process payment - should succeed
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(4)
      ).to.not.be.reverted;
    });
    
    it("Should handle payment processing with insufficient allowance", async function () {
      const amount = ethers.parseUnits("10", 6);
      const processorFee = ethers.parseUnits("0.5", 6);
      const insufficientAllowance = amount; // Missing processor fee
      
      // Approve insufficient amount
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), insufficientAllowance);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        5, // senderId
        5, // recipientId
        amount, // amount
        86400, // 1 day interval (minimum allowed)
        "Insufficient Allowance Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        processorFee, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - should fail due to insufficient allowance
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(5)
      ).to.be.revertedWith("Insufficient PYUSD allowance");
    });
    
    it("Should handle payment processing with minimum amount subscription", async function () {
      const amount = ethers.parseUnits("0.01", 6); // Minimum amount (1 cent)
      const processorFee = ethers.parseUnits("0.5", 6);
      
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), amount + processorFee);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        6, // senderId
        6, // recipientId
        amount, // amount (minimum)
        86400, // 1 day interval (minimum allowed)
        "Minimum Amount Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        processorFee, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      // Process payment - should succeed (only processor fee is transferred)
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(6)
      ).to.not.be.reverted;
    });
  });
  
  describe("Multiple Users and Subscriptions", function () {
    it("Should handle multiple users with multiple subscriptions", async function () {
      const userCount = 3;
      const subscriptionsPerUser = 2;
      
      // Create subscriptions for multiple users
      for (let userIndex = 0; userIndex < userCount; userIndex++) {
        const user = userIndex === 0 ? user1 : userIndex === 1 ? user2 : landlord;
        
        for (let subIndex = 1; subIndex <= subscriptionsPerUser; subIndex++) {
          await pyusdContract.connect(user).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
          
          await stableRentContract.connect(user).createSubscription(
            userIndex * 10 + subIndex, // senderId
            userIndex * 10 + subIndex, // recipientId
            ethers.parseUnits("10", 6), // amount
            86400, // 1 day interval (minimum allowed)
            `User ${userIndex} Service ${subIndex}`, // serviceName
            (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now)
            0, // endDate
            0, // maxPayments
            serviceProvider.address, // recipientAddress
            "PYUSD", // senderCurrency
            "PYUSD", // recipientCurrency
            ethers.parseUnits("0.5", 6), // processorFee
            owner.address, // processorFeeAddress
            "PYUSD", // processorFeeCurrency
            1 // processorFeeID
          );
        }
      }
      
      // Verify all subscriptions were created
      const user1Subs = await stableRentContract.getUserSubscriptions(user1.address);
      const user2Subs = await stableRentContract.getUserSubscriptions(user2.address);
      const landlordSubs = await stableRentContract.getUserSubscriptions(landlord.address);
      
      expect(user1Subs).to.have.length(subscriptionsPerUser);
      expect(user2Subs).to.have.length(subscriptionsPerUser);
      expect(landlordSubs).to.have.length(subscriptionsPerUser);
    });
    
    it("Should handle getPaymentsDue with mixed subscription states", async function () {
      // Create active subscription
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
      await stableRentContract.connect(user1).createSubscription(
        100, // senderId
        100, // recipientId
        ethers.parseUnits("10", 6), // amount
        86400, // 1 day interval (minimum allowed)
        "Active Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      // Create cancelled subscription
      await stableRentContract.connect(user1).createSubscription(
        101, // senderId
        101, // recipientId
        ethers.parseUnits("10", 6), // amount
        86400, // 1 day interval (minimum allowed)
        "Cancelled Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      // Cancel the second subscription
      await stableRentContract.connect(user1).cancelSubscription(102);
      
      // Fast forward to make active subscription due
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      // Check getPaymentsDue - should only return active subscription
      const duePayments = await stableRentContract.getPaymentsDue();
      expect(duePayments).to.have.length(1);
      expect(duePayments[0]).to.equal(101); // Active subscription ID
    });
  });
  
  describe("Gas and Performance Tests", function () {
    it("Should handle large number of subscriptions efficiently", async function () {
      const subscriptionCount = 50;
      
      // Create many subscriptions
      for (let i = 1; i <= subscriptionCount; i++) {
        await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
        
        await stableRentContract.connect(user1).createSubscription(
          i, // senderId
          i, // recipientId
          ethers.parseUnits("1", 6), // amount
          86400, // 1 day interval (minimum allowed)
          `Service ${i}`, // serviceName
          (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now)
          0, // endDate
          0, // maxPayments
          serviceProvider.address, // recipientAddress
          "PYUSD", // senderCurrency
          "PYUSD", // recipientCurrency
          ethers.parseUnits("0.1", 6), // processorFee
          owner.address, // processorFeeAddress
          "PYUSD", // processorFeeCurrency
          1 // processorFeeID
        );
      }
      
      // Verify all subscriptions were created
      const userSubscriptions = await stableRentContract.getUserSubscriptions(user1.address);
      expect(userSubscriptions).to.have.length(subscriptionCount);
      
      // Fast forward to make all payments due
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);
      
      // Check getPaymentsDue performance
      const duePayments = await stableRentContract.getPaymentsDue();
      expect(duePayments).to.have.length(subscriptionCount);
    });
  });
});
