import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS, DEFAULT_PROCESSOR_FEE, PROCESSOR_FEE_ID } from "./helpers/setup";

describe("SubChainSubscription - Payments Due", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SPOTIFY_ID = 2;
  const ALCHEMY_ID = 3;
  const SERVICE_PROVIDER_ID = 100;
  const LANDLORD_ID = 101;
  
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
  
  beforeEach(async function () {
    // Get contracts and signers
    ({ subChainContract, pyusdContract, owner, user1, user2, serviceProvider, landlord } = 
      await setupTestContracts());
    
    // Approve PYUSD spending for both users
    await pyusdContract.connect(user1).approve(
      await subChainContract.getAddress(),
      ethers.parseUnits("1000", 6)
    );
    
    await pyusdContract.connect(user2).approve(
      await subChainContract.getAddress(),
      ethers.parseUnits("1000", 6)
    );
  });
  
  describe("Single Payment Due", function () {
    it("Should return empty array when no payments are due", async function () {
      // Create subscription with 30-day interval
      await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("10", 6),
        THIRTY_DAYS,
        "Netflix Premium",
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
      
      // Check payments due - should be empty as first payment isn't due yet
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments.length).to.equal(0);
    });
    
    it("Should return subscription ID when payment is due", async function () {
      // Create subscription with 1-day interval
      const tx = await subChainContract.connect(user1).createSubscription(
        SPOTIFY_ID, // senderId
        LANDLORD_ID, // recipientId
        ethers.parseUnits("15", 6),
        ONE_DAY,
        "Spotify Premium",
        0,
        0,
        landlord.address, // recipientAddress (using landlord for Spotify)
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
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      const subscriptionId = parsedEvent!.args[0];
      
      // Fast forward 1 day + 1 second to make payment due
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Check payments due - should include our subscription
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments.length).to.equal(1);
      expect(duePayments[0]).to.equal(subscriptionId);
    });
    
    it("Should not return cancelled subscriptions", async function () {
      // Create subscription
      const tx = await subChainContract.connect(user1).createSubscription(
        ALCHEMY_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("20", 6),
        ONE_DAY,
        "Alchemy Pro",
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
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      const subscriptionId = parsedEvent!.args[0];
      
      // Fast forward 1 day + 1 second
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Cancel subscription
      await subChainContract.connect(user1).cancelSubscription(subscriptionId);
      
      // Check payments due - should not include cancelled subscription
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments).to.not.include(subscriptionId);
    });
    
    it("Should not return subscriptions that have reached maxPayments", async function () {
      // Create subscription with maxPayments = 1
      const tx = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("10", 6),
        ONE_DAY,
        "Netflix Basic",
        0,
        1, // maxPayments = 1
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
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      const subscriptionId = parsedEvent!.args[0];
      
      // Fast forward 1 day + 1 second
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Process payment
      await subChainContract.processPayment(subscriptionId);
      
      // Fast forward another day
      await ethers.provider.send("evm_increaseTime", [ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - this should trigger maxPayments cancellation
      await subChainContract.processPayment(subscriptionId);
      
      // Check payments due - should not include subscription that reached maxPayments
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments).to.not.include(subscriptionId);
    });
    
    it("Should not return subscriptions that have reached endDate", async function () {
      // Get current timestamp
      const block = await ethers.provider.getBlock("latest");
      const endDate = block!.timestamp + (2 * ONE_DAY); // 2 days from now
      
      // Create subscription with endDate
      const tx = await subChainContract.connect(user1).createSubscription(
        SPOTIFY_ID, // senderId
        LANDLORD_ID, // recipientId
        ethers.parseUnits("15", 6),
        ONE_DAY,
        "Spotify Family",
        endDate,
        0,
        landlord.address, // recipientAddress (using landlord for Spotify)
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
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      
      const parsedEvent = subChainContract.interface.parseLog(event!);
      const subscriptionId = parsedEvent!.args[0];
      
      // Fast forward 3 days (past endDate)
      await ethers.provider.send("evm_increaseTime", [3 * ONE_DAY]);
      await ethers.provider.send("evm_mine", []);
      
      // Try to process payment - this should trigger endDate cancellation
      await subChainContract.processPayment(subscriptionId);
      
      // Check payments due - should not include expired subscription
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments).to.not.include(subscriptionId);
    });
  });
  
  describe("Multiple Payments Due", function () {
    it("Should return all due subscriptions in order", async function () {
      // Create 3 subscriptions with different intervals
      const tx1 = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("10", 6),
        ONE_DAY,
        "Netflix Premium",
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
      
      const tx2 = await subChainContract.connect(user2).createSubscription(
        SPOTIFY_ID, // senderId
        LANDLORD_ID, // recipientId
        ethers.parseUnits("15", 6),
        2 * ONE_DAY, // 2 days
        "Spotify Premium",
        0,
        0,
        landlord.address, // recipientAddress (using landlord for Spotify)
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const tx3 = await subChainContract.connect(user1).createSubscription(
        ALCHEMY_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("20", 6),
        3 * ONE_DAY, // 3 days
        "Alchemy Pro",
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
      
      // Get subscription IDs
      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      const sub1Id = subChainContract.interface.parseLog(event1!).args[0];
      
      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      const sub2Id = subChainContract.interface.parseLog(event2!).args[0];
      
      const receipt3 = await tx3.wait();
      const event3 = receipt3?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      const sub3Id = subChainContract.interface.parseLog(event3!).args[0];
      
      // Fast forward 3 days + 1 second to make all payments due
      await ethers.provider.send("evm_increaseTime", [3 * ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Check payments due - should include all 3 subscriptions
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments.length).to.equal(3);
      expect(duePayments).to.include(sub1Id);
      expect(duePayments).to.include(sub2Id);
      expect(duePayments).to.include(sub3Id);
      
      // Verify they're returned in subscription ID order
      expect(duePayments[0]).to.equal(sub1Id);
      expect(duePayments[1]).to.equal(sub2Id);
      expect(duePayments[2]).to.equal(sub3Id);
    });
    
    it("Should handle mix of due and not due subscriptions", async function () {
      // Create 3 subscriptions with different intervals
      const tx1 = await subChainContract.connect(user1).createSubscription(
        NETFLIX_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("10", 6),
        ONE_DAY,
        "Netflix Premium",
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
      
      const tx2 = await subChainContract.connect(user2).createSubscription(
        SPOTIFY_ID, // senderId
        LANDLORD_ID, // recipientId
        ethers.parseUnits("15", 6),
        5 * ONE_DAY, // 5 days
        "Spotify Premium",
        0,
        0,
        landlord.address, // recipientAddress (using landlord for Spotify)
        "PYUSD", // senderCurrency
        "PYUSD", // recipientCurrency
        DEFAULT_PROCESSOR_FEE, // processorFee
        owner.address, // processorFeeAddress
        "PYUSD", // processorFeeCurrency
        PROCESSOR_FEE_ID // processorFeeID
      );
      
      const tx3 = await subChainContract.connect(user1).createSubscription(
        ALCHEMY_ID, // senderId
        SERVICE_PROVIDER_ID, // recipientId
        ethers.parseUnits("20", 6),
        2 * ONE_DAY, // 2 days
        "Alchemy Pro",
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
      
      // Get subscription IDs
      const receipt1 = await tx1.wait();
      const event1 = receipt1?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      const sub1Id = subChainContract.interface.parseLog(event1!).args[0];
      
      const receipt3 = await tx3.wait();
      const event3 = receipt3?.logs.find(log => {
        try {
          return subChainContract.interface.parseLog(log)?.name === "SubscriptionCreated";
        } catch {
          return false;
        }
      });
      const sub3Id = subChainContract.interface.parseLog(event3!).args[0];
      
      // Fast forward 2 days + 1 second
      // This makes sub1 (1 day) and sub3 (2 days) due, but not sub2 (5 days)
      await ethers.provider.send("evm_increaseTime", [2 * ONE_DAY + 1]);
      await ethers.provider.send("evm_mine", []);
      
      // Check payments due - should include only the due subscriptions
      const duePayments = await subChainContract.getPaymentsDue();
      expect(duePayments.length).to.equal(2);
      expect(duePayments).to.include(sub1Id);
      expect(duePayments).to.include(sub3Id);
      
      // Verify they're returned in subscription ID order
      expect(duePayments[0]).to.equal(sub1Id);
      expect(duePayments[1]).to.equal(sub3Id);
    });
  });
});
