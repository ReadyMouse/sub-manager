import { ethers } from "hardhat";
import { SubChainSubscription } from "../../typechain-types";
import { IERC20Metadata } from "../../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Real PYUSD contract address on Ethereum mainnet
export const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";

// Address that holds PYUSD tokens (we'll impersonate this)
// This address has ~15.8 million PYUSD
export const PYUSD_WHALE = "0xCFFAd3200574698b78f32232aa9D63eABD290703";

// Common time constants
export const ONE_DAY = 24 * 60 * 60;
export const THIRTY_DAYS = 30 * ONE_DAY;

// Processor fee constants
export const DEFAULT_PROCESSOR_FEE = ethers.parseUnits("0.50", 6); // $0.50 in PYUSD
export const PROCESSOR_FEE_ID = 1; // Default processor fee ID

/**
 * Fund an account with PYUSD by impersonating the whale address
 * @param recipient Address to receive PYUSD
 * @param amount Amount of PYUSD to send (in base units, 6 decimals)
 */
export async function fundAccountWithPyusd(recipient: string, amount: bigint) {
  // Impersonate the whale address
  await ethers.provider.send("hardhat_impersonateAccount", [PYUSD_WHALE]);
  const whaleSigner = await ethers.getSigner(PYUSD_WHALE);
  
  // Send ETH to whale for gas fees
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
    to: PYUSD_WHALE,
    value: ethers.parseEther("1.0")
  });
  
  // Get PYUSD contract
  const pyusdContract = await ethers.getContractAt("IERC20Metadata", PYUSD_ADDRESS);
  
  // Transfer PYUSD from whale to recipient
  await pyusdContract.connect(whaleSigner).transfer(recipient, amount);
  
  // Stop impersonating
  await ethers.provider.send("hardhat_stopImpersonatingAccount", [PYUSD_WHALE]);
}

/**
 * Set up test contracts and accounts
 * @returns Contracts and signers needed for tests
 */
export async function setupTestContracts() {
  console.log("\n🚀 Setting up SubChainSubscription test environment...");
  
  // Get signers
  const [owner, user1, user2, serviceProvider, landlord] = await ethers.getSigners();
  
  console.log("📋 Test Accounts:");
  console.log("  Owner:", owner.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  console.log("  Service Provider:", serviceProvider.address);
  console.log("  Landlord:", landlord.address);
  
  // Get PYUSD contract instance
  const pyusdContract = await ethers.getContractAt("IERC20Metadata", PYUSD_ADDRESS);
  console.log("\n💰 Connected to PYUSD:", PYUSD_ADDRESS);
  
  // Deploy SubChainSubscription contract
  const SubChainSubscription = await ethers.getContractFactory("SubChainSubscription");
  const subChainContract = await SubChainSubscription.deploy(owner.address, PYUSD_ADDRESS);
  await subChainContract.waitForDeployment();
  
  const contractAddress = await subChainContract.getAddress();
  console.log("📝 SubChainSubscription deployed:", contractAddress);
  
  // Fund test accounts with PYUSD
  console.log("\n💸 Funding test accounts with PYUSD...");
  const fundAmount = ethers.parseUnits("10000", 6); // 10,000 PYUSD each
  
  await fundAccountWithPyusd(user1.address, fundAmount);
  await fundAccountWithPyusd(user2.address, fundAmount);
  
  const user1Balance = await pyusdContract.balanceOf(user1.address);
  const user2Balance = await pyusdContract.balanceOf(user2.address);
  
  console.log("  User1 balance:", ethers.formatUnits(user1Balance, 6), "PYUSD");
  console.log("  User2 balance:", ethers.formatUnits(user2Balance, 6), "PYUSD");
  
  console.log("\n✅ Setup complete!\n");
  
  return {
    subChainContract,
    pyusdContract,
    owner,
    user1,
    user2,
    serviceProvider,
    landlord
  };
}
