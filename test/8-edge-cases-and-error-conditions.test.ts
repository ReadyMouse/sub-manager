import { expect } from "chai";
import { ethers } from "hardhat";
import { StableRentSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, fundAccountWithPyusd } from "./helpers/setup";

describe("StableRentSubscription - Edge Cases and Error Conditions", function () {
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
  
  describe("Constructor Edge Cases", function () {
    it("Should revert with zero address for PYUSD token", async function () {
      const StableRentSubscription = await ethers.getContractFactory("contracts/StableRentSubscription.sol:StableRentSubscription");
      
      await expect(
        StableRentSubscription.deploy(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid PYUSD token address");
    });
  });
  
  describe("Subscription Creation Edge Cases", function () {
    let subscriptionId: number;
    
    beforeEach(async function () {
      // Approve contract to spend PYUSD
      const amount = ethers.parseUnits("100", 6); // 100 PYUSD
      const processorFee = ethers.parseUnits("0.5", 6);
      const totalNeeded = amount + processorFee;
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), totalNeeded);
    });
    
    it("Should handle very large amounts", async function () {
      const largeAmount = ethers.parseUnits("1000000", 6); // 1M PYUSD
      const processorFee = ethers.parseUnits("0.5", 6);
      const totalNeeded = largeAmount + processorFee;
      
      // Fund user with large amount
      await fundAccountWithPyusd(user1.address, largeAmount);
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), totalNeeded);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        largeAmount, // amount
        2592000, // 30 days interval
        "Large Amount Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate (unlimited)
        0, // maxPayments (unlimited)
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          const parsed = stableRentContract.interface.parseLog(log);
          return parsed?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      subscriptionId = 1;
    });
    
    it("Should handle maximum interval (365 days)", async function () {
      const maxInterval = 365 * 24 * 60 * 60; // 365 days in seconds
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        maxInterval, // interval
        "Yearly Service",
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
    });
    
    it("Should handle minimum interval (1 day)", async function () {
      const minInterval = 24 * 60 * 60; // 1 day in seconds
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        minInterval, // interval
        "Daily Service",
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
    });
    
    it("Should handle very long service names", async function () {
      const longServiceName = "A".repeat(50); // 50 character service name
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        2592000, // interval
        longServiceName, // serviceName
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
      
      await expect(tx).to.not.be.reverted;
    });
    
    it("Should handle very long currency tickers", async function () {
      const longCurrency = "BTC".repeat(3); // 9 character currency (within limits)
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        2592000, // interval
        "Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        longCurrency, // senderCurrency
        longCurrency, // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
    });
  });
  
  describe("Payment Processing Edge Cases", function () {
    let subscriptionId: number;
    
    beforeEach(async function () {
      // Create a subscription
      const amount = ethers.parseUnits("10", 6); // 10 PYUSD
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), amount);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        amount, // amount
        2592000, // 30 days interval
        "Test Service",
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
      
      subscriptionId = 1;
    });
    
    it("Should handle payment with exact balance", async function () {
      // Get user's current balance
      const currentBalance = await pyusdContract.balanceOf(user1.address);
      const processorFee = ethers.parseUnits("0.5", 6);
      
      // Create subscription with exact balance
      const exactAmount = currentBalance - processorFee; // Leave room for processor fee
      
      // Approve the exact amount needed
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), exactAmount + processorFee);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        2, // senderId
        2, // recipientId
        exactAmount, // amount
        2592000, // interval
        "Exact Amount Service",
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
    });
    
    it("Should handle multiple failed payments reaching the limit", async function () {
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [2592000]); // 30 days
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment 3 times (should fail due to insufficient balance)
      // First attempt
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(subscriptionId)
      ).to.be.revertedWith("Insufficient PYUSD balance");
      
      // Second attempt
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(subscriptionId)
      ).to.be.revertedWith("Insufficient PYUSD balance");
      
      // Third attempt - should auto-cancel
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(subscriptionId)
      ).to.be.revertedWith("Insufficient PYUSD balance");
      
      // Check that subscription is now inactive
      const subscription = await stableRentContract.getSubscription(subscriptionId);
      expect(subscription.isActive).to.be.false;
    });
    
    it("Should handle payment processing with zero processor fee", async function () {
      // Create subscription with zero processor fee
      const tx = await stableRentContract.connect(user1).createSubscription(
        3, // senderId
        3, // recipientId
        ethers.parseUnits("10", 6), // amount
        2592000, // interval
        "Zero Fee Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        0, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        0, // processorFee (zero)
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
      
      // Fast forward to make payment due
      await ethers.provider.send("evm_increaseTime", [2592000]);
      await ethers.provider.send("evm_mine", []);
      
      // Process payment
      await expect(
        stableRentContract.connect(serviceProvider).processPayment(3)
      ).to.not.be.reverted;
    });
  });
  
  describe("View Functions Edge Cases", function () {
    it("Should handle getPaymentsDue with no subscriptions", async function () {
      // Deploy a fresh contract
      const StableRentSubscription = await ethers.getContractFactory("contracts/StableRentSubscription.sol:StableRentSubscription");
      const freshContract = await StableRentSubscription.deploy(owner.address, await pyusdContract.getAddress());
      
      const duePayments = await freshContract.getPaymentsDue();
      expect(duePayments).to.have.length(0);
    });
    
    it("Should handle getUserSubscriptions with no subscriptions", async function () {
      // Use a fresh user that hasn't created any subscriptions
      const [freshUser] = await ethers.getSigners();
      const userSubscriptions = await stableRentContract.getUserSubscriptions(freshUser.address);
      expect(userSubscriptions).to.have.length(0);
    });
    
    it("Should handle getSubscription with non-existent subscription", async function () {
      await expect(
        stableRentContract.getSubscription(999)
      ).to.be.revertedWith("Subscription does not exist");
    });
  });
  
  describe("Boundary Conditions", function () {
    it("Should handle subscription with maximum endDate", async function () {
      const maxEndDate = 2n ** 64n - 1n; // Maximum uint64 value
      const amount = ethers.parseUnits("10", 6);
      const processorFee = ethers.parseUnits("0.5", 6);
      const totalNeeded = amount + processorFee;
      
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), totalNeeded);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        2592000, // interval
        "Max End Date Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        maxEndDate, // endDate
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
    });
    
    it("Should handle subscription with maximum maxPayments", async function () {
      const maxPayments = 2n ** 32n - 1n; // Maximum uint32 value
      const amount = ethers.parseUnits("10", 6);
      const processorFee = ethers.parseUnits("0.5", 6);
      const totalNeeded = amount + processorFee;
      
      await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), totalNeeded);
      
      const tx = await stableRentContract.connect(user1).createSubscription(
        1, // senderId
        1, // recipientId
        ethers.parseUnits("10", 6), // amount
        2592000, // interval
        "Max Payments Service",
      (await ethers.provider.getBlock("latest")).timestamp + 3600, // startDate (1 hour from now) // serviceName
        0, // endDate
        maxPayments, // maxPayments
        serviceProvider.address, // recipientAddress
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        ethers.parseUnits("0.5", 6), // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        1 // processorFeeID
      );
      
      await expect(tx).to.not.be.reverted;
    });
  });
  
  describe("Gas Optimization Edge Cases", function () {
    it("Should handle multiple subscriptions efficiently", async function () {
      const subscriptionCount = 5; // Reduced to avoid conflicts with other tests
      
      // Create multiple subscriptions
      for (let i = 1; i <= subscriptionCount; i++) {
        await pyusdContract.connect(user1).approve(await stableRentContract.getAddress(), ethers.parseUnits("100", 6));
        
        await stableRentContract.connect(user1).createSubscription(
          i, // senderId
          i, // recipientId
          ethers.parseUnits("10", 6), // amount
          2592000, // interval
          `Service ${i}`, // serviceName
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
      
      // Check that all subscriptions were created
      const userSubscriptions = await stableRentContract.getUserSubscriptions(user1.address);
      expect(userSubscriptions).to.have.length(subscriptionCount);
    });
  });
});
