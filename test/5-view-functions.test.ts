import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS, DEFAULT_PROCESSOR_FEE, PROCESSOR_FEE_ID } from "./helpers/setup";

describe("SubChainSubscription - View Functions", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SPOTIFY_ID = 2;
  const SERVICE_PROVIDER_ID = 100;
  const LANDLORD_ID = 101;
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
    
    // Create a test subscription
    const amount = ethers.parseUnits("10", 6); // 10 PYUSD
    const interval = THIRTY_DAYS;
    
    // Approve PYUSD spending
    await pyusdContract.connect(user1).approve(
      await subChainContract.getAddress(),
      ethers.parseUnits("1000", 6)
    );
    
    // Create subscription
    const tx = await subChainContract.connect(user1).createSubscription(
      NETFLIX_ID, // senderId
      SERVICE_PROVIDER_ID, // recipientId
      amount,
      interval,
      "Netflix Premium",
      0, // No endDate
      0, // No maxPayments
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
    subscriptionId = parsedEvent!.args[0];
  });
  
  describe("Subscription View Functions", function () {
    it("Should return correct subscription details", async function () {
      const sub = await subChainContract.getSubscription(subscriptionId);
      
      expect(sub.id).to.equal(subscriptionId);
      expect(sub.senderAddress).to.equal(user1.address);
      expect(sub.senderId).to.equal(NETFLIX_ID);
      expect(sub.recipientId).to.equal(SERVICE_PROVIDER_ID);
      expect(sub.amount).to.equal(ethers.parseUnits("10", 6));
      expect(sub.interval).to.equal(THIRTY_DAYS);
      expect(sub.isActive).to.be.true;
      expect(sub.recipientAddress).to.equal(serviceProvider.address);
      expect(sub.senderCurrency).to.equal("PYUSD");
      expect(sub.recipientCurrency).to.equal("PYUSD");
      expect(sub.failedPaymentCount).to.equal(0);
      expect(sub.paymentCount).to.equal(0);
      expect(sub.serviceName).to.equal("Netflix Premium");
      expect(sub.endDate).to.equal(0);
      expect(sub.maxPayments).to.equal(0);
    });
    
    it("Should return correct user subscriptions", async function () {
      // Create another subscription for user1
      await subChainContract.connect(user1).createSubscription(
        SPOTIFY_ID, // senderId
        LANDLORD_ID, // recipientId
        ethers.parseUnits("15", 6),
        THIRTY_DAYS,
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
      
      const userSubs = await subChainContract.getUserSubscriptions(user1.address);
      expect(userSubs.length).to.equal(2);
      expect(userSubs[0]).to.equal(subscriptionId); // First subscription
      expect(userSubs[1]).to.equal(subscriptionId + BigInt(1)); // Second subscription
      
      // Check user2 has no subscriptions
      const user2Subs = await subChainContract.getUserSubscriptions(user2.address);
      expect(user2Subs.length).to.equal(0);
    });
    
    it("Should revert when querying non-existent subscription", async function () {
      await expect(subChainContract.getSubscription(99999))
        .to.be.revertedWith("Subscription does not exist");
    });
  });
});
