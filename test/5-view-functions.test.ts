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
      
    // Register Netflix as a verified provider
    await subChainContract.connect(owner).registerServiceProvider(
      NETFLIX_ID,
      serviceProvider.address,
      0 // PaymentType.DirectCrypto
    );
    
    // Register Spotify as a verified provider
    await subChainContract.connect(owner).registerServiceProvider(
      SPOTIFY_ID,
      landlord.address, // Using landlord address as Spotify's payment address
      0 // PaymentType.DirectCrypto
    );
    
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
      false // Not private
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
  
  describe("Provider View Functions", function () {
    it("Should return correct provider address", async function () {
      expect(await subChainContract.getProviderAddress(NETFLIX_ID)).to.equal(serviceProvider.address);
      expect(await subChainContract.getProviderAddress(SPOTIFY_ID)).to.equal(landlord.address);
    });
    
    it("Should return correct provider type", async function () {
      expect(await subChainContract.getProviderType(NETFLIX_ID)).to.equal(0); // PublicVerified
      expect(await subChainContract.getProviderType(SPOTIFY_ID)).to.equal(0); // PublicVerified
    });
    
    it("Should return correct provider owner", async function () {
      expect(await subChainContract.getProviderOwner(NETFLIX_ID)).to.equal(ethers.ZeroAddress); // Owner is zero for verified providers
      expect(await subChainContract.getProviderOwner(SPOTIFY_ID)).to.equal(ethers.ZeroAddress);
    });
    
    it("Should return correct provider payment type", async function () {
      expect(await subChainContract.getProviderPaymentType(NETFLIX_ID)).to.equal(0); // DirectCrypto
      expect(await subChainContract.getProviderPaymentType(SPOTIFY_ID)).to.equal(0);
    });
    
    it("Should return correct provider existence", async function () {
      expect(await subChainContract.providerExists(NETFLIX_ID)).to.be.true;
      expect(await subChainContract.providerExists(SPOTIFY_ID)).to.be.true;
      expect(await subChainContract.providerExists(99999)).to.be.false;
    });
    
    it("Should revert when querying non-existent provider", async function () {
      await expect(subChainContract.getProviderAddress(99999))
        .to.be.revertedWith("Service provider does not exist");
      
      await expect(subChainContract.getProviderType(99999))
        .to.be.revertedWith("Service provider does not exist");
      
      await expect(subChainContract.getProviderOwner(99999))
        .to.be.revertedWith("Service provider does not exist");
      
      await expect(subChainContract.getProviderPaymentType(99999))
        .to.be.revertedWith("Service provider does not exist");
    });
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
      expect(sub.isPrivate).to.be.false;
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
        false
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
