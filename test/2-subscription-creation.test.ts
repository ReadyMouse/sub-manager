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
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedEndDate = block!.timestamp + (maxPayments * interval);
      expect(sub.endDate).to.equal(expectedEndDate);
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
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const calculatedEndFromPayments = block!.timestamp + (maxPayments * interval);
      expect(sub.endDate).to.equal(calculatedEndFromPayments);
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
