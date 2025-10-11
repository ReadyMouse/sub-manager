import { expect } from "chai";
import { ethers } from "hardhat";
import { SubChainSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, fundAccountWithPyusd } from "./helpers/setup";

describe("SubChainSubscription - Setup & Providers", function () {
  // ========================================
  // CONSTANTS & VARIABLES
  // ========================================
  
  const NETFLIX_ID = 1;
  const SPOTIFY_ID = 2;
  
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
  });
  
  describe("Setup Verification", function () {
    it("Should have deployed SubChainSubscription contract", async function () {
      const contractAddress = await subChainContract.getAddress();
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should have correct PYUSD token address", async function () {
      expect(await subChainContract.pyusdToken()).to.equal(await pyusdContract.getAddress());
    });
    
    it("Should have correct owner", async function () {
      expect(await subChainContract.owner()).to.equal(owner.address);
    });
    
    it("Should have funded test accounts with PYUSD", async function () {
      const user1Balance = await pyusdContract.balanceOf(user1.address);
      const user2Balance = await pyusdContract.balanceOf(user2.address);
      
      expect(user1Balance).to.be.gt(0);
      expect(user2Balance).to.be.gt(0);
    });
  });
  
  describe("Provider Registration", function () {
    describe("Public Verified Providers (Owner Only)", function () {
      it("Should allow owner to register a verified public provider", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            NETFLIX_ID,
            serviceProvider.address,
            0 // PaymentType.DirectCrypto
          )
        ).to.emit(subChainContract, "ServiceProviderUpdated")
          .withArgs(NETFLIX_ID, serviceProvider.address, 0, 0, ethers.ZeroAddress, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
      });
      
      it("Should verify provider exists and has correct data", async function () {
        expect(await subChainContract.providerExists(NETFLIX_ID)).to.be.true;
        expect(await subChainContract.getProviderAddress(NETFLIX_ID)).to.equal(serviceProvider.address);
        expect(await subChainContract.getProviderType(NETFLIX_ID)).to.equal(0); // PublicVerified
        expect(await subChainContract.getProviderOwner(NETFLIX_ID)).to.equal(ethers.ZeroAddress);
        expect(await subChainContract.getProviderPaymentType(NETFLIX_ID)).to.equal(0); // DirectCrypto
      });
      
      it("Should revert if non-owner tries to register verified provider", async function () {
        await expect(
          subChainContract.connect(user1).registerServiceProvider(
            SPOTIFY_ID,
            serviceProvider.address,
            0
          )
        ).to.be.revertedWithCustomError(subChainContract, "OwnableUnauthorizedAccount");
      });
      
      it("Should revert with invalid provider ID", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            0,
            serviceProvider.address,
            0
          )
        ).to.be.revertedWith("Invalid service provider ID");
      });
      
      it("Should revert with invalid payment address", async function () {
        await expect(
          subChainContract.connect(owner).registerServiceProvider(
            SPOTIFY_ID,
            ethers.ZeroAddress,
            0
          )
        ).to.be.revertedWith("Invalid payment address");
      });
    });
    
    describe("Public Unverified Providers (Any User)", function () {
      let unverifiedProviderId: bigint;
      
      it("Should allow any user to register an unverified public provider", async function () {
        const tx = await subChainContract.connect(user1).registerPublicUnverifiedProvider(serviceProvider.address);
        const receipt = await tx.wait();
        
        // Extract provider ID from event
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "ServiceProviderUpdated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        unverifiedProviderId = parsedEvent!.args[0];
        
        expect(unverifiedProviderId).to.be.gt(0);
      });
      
      it("Should have correct provider type and owner", async function () {
        expect(await subChainContract.providerExists(unverifiedProviderId)).to.be.true;
        expect(await subChainContract.getProviderType(unverifiedProviderId)).to.equal(1); // PublicUnverified
        expect(await subChainContract.getProviderOwner(unverifiedProviderId)).to.equal(user1.address);
        expect(await subChainContract.getProviderPaymentType(unverifiedProviderId)).to.equal(0); // DirectCrypto only
      });
      
      it("Should revert with invalid payment address", async function () {
        await expect(
          subChainContract.connect(user1).registerPublicUnverifiedProvider(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid payment address");
      });
    });
    
    describe("Private Providers (Any User)", function () {
      let privateProviderId: bigint;
      
      it("Should allow any user to register a private provider", async function () {
        const tx = await subChainContract.connect(user1).registerPrivateProvider(landlord.address);
        const receipt = await tx.wait();
        
        // Extract provider ID from event
        const event = receipt?.logs.find(log => {
          try {
            return subChainContract.interface.parseLog(log)?.name === "ServiceProviderUpdated";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = subChainContract.interface.parseLog(event!);
        privateProviderId = parsedEvent!.args[0];
        
        expect(privateProviderId).to.be.gt(0);
      });
      
      it("Should have correct provider type and owner", async function () {
        expect(await subChainContract.providerExists(privateProviderId)).to.be.true;
        expect(await subChainContract.getProviderType(privateProviderId)).to.equal(2); // Private
        expect(await subChainContract.getProviderOwner(privateProviderId)).to.equal(user1.address);
        expect(await subChainContract.getProviderAddress(privateProviderId)).to.equal(landlord.address);
        expect(await subChainContract.getProviderPaymentType(privateProviderId)).to.equal(0); // DirectCrypto only
      });
    });
    
    describe("Provider Query Functions", function () {
      it("Should return false for non-existent provider", async function () {
        expect(await subChainContract.providerExists(99999)).to.be.false;
      });
      
      it("Should revert when querying non-existent provider data", async function () {
        await expect(
          subChainContract.getProviderAddress(99999)
        ).to.be.revertedWith("Service provider does not exist");
        
        await expect(
          subChainContract.getProviderType(99999)
        ).to.be.revertedWith("Service provider does not exist");
      });
    });
  });
});
