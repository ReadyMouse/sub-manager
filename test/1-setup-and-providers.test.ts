import { expect } from "chai";
import { ethers } from "hardhat";
import { StableRentSubscription } from "../typechain-types";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { setupTestContracts, fundAccountWithPyusd } from "./helpers/setup";

describe("StableRentSubscription - Setup", function () {
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
  
  describe("Setup Verification", function () {
    it("Should have deployed StableRentSubscription contract", async function () {
      const contractAddress = await stableRentContract.getAddress();
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should have correct PYUSD token address", async function () {
      expect(await stableRentContract.pyusdToken()).to.equal(await pyusdContract.getAddress());
    });
    
    it("Should have correct owner", async function () {
      expect(await stableRentContract.owner()).to.equal(owner.address);
    });
    
    it("Should have funded test accounts with PYUSD", async function () {
      const user1Balance = await pyusdContract.balanceOf(user1.address);
      const user2Balance = await pyusdContract.balanceOf(user2.address);
      
      expect(user1Balance).to.be.gt(0);
      expect(user2Balance).to.be.gt(0);
    });
  });
});
