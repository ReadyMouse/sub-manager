import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, ONE_DAY, THIRTY_DAYS } from "./helpers/setup";

describe("SubChainSubscription - View Functions", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SPOTIFY_ID = 2;
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
      NETFLIX_ID,
      amount,
      interval,
      "Netflix Premium",
      0, // No endDate
      0, // No maxPayments
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
    subscriptionId = parsedEvent!.args[0];
  });
  
  describe("Subscription View Functions", function () {
    it("Should return correct subscription details", async function () {
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
    
    it("Should return correct user subscriptions", async function () {
      // Create another subscription for user1
      await subChainContract.connect(user1).createSubscription(
        SPOTIFY_ID,
        ethers.parseUnits("15", 6),
        THIRTY_DAYS,
        "Spotify Premium",
        0,
        0,
        2, // PaymentType.DirectRecipientWallet
        0, // ProviderType.PublicVerified
        landlord.address, // recipientAddress (using landlord for Spotify)
        "" // recipientCurrency
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
