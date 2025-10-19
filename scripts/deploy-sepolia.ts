// ========================================
// IMPORTS
// ========================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * ============================================================
 * STABLERENT SEPOLIA DEPLOYMENT SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Deploys the StableRentSubscription contract to Sepolia testnet
 * 
 * PREREQUISITES:
 * 1. Add to .env file:
 *    - SEPOLIA_RPC_URL (get free API key from Alchemy)
 *    - SEPOLIA_PRIVATE_KEY (your deployer wallet private key)
 * 2. Get Sepolia ETH from faucet (e.g., https://sepoliafaucet.com/)
 * 3. Get PYUSD testnet tokens from PYUSD faucet
 * 
 * HOW TO RUN:
 * npx hardhat run scripts/deploy-sepolia.ts --network sepolia
 * 
 * WHAT IT DOES:
 * 1. Deploys StableRentSubscription contract to Sepolia
 * 2. Saves deployment addresses to deployments/sepolia.json
 * 3. Displays configuration for frontend and backend
 */

async function main() {
  console.log("🚀 Deploying StableRent to Sepolia Testnet...\n");

  // ========================================
  // CONFIGURATION
  // ========================================
  
  // PYUSD contract address on Sepolia testnet
  const PYUSD_ADDRESS = "0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53";
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "SepoliaETH\n");
  
  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  WARNING: Low balance! Get Sepolia ETH from:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("");
  }

  // Verify network
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());
  
  if (network.chainId !== 11155111n) {
    throw new Error("❌ ERROR: Not connected to Sepolia! Chain ID should be 11155111");
  }
  console.log("✅ Confirmed: Connected to Sepolia testnet\n");

  // ========================================
  // DEPLOY STABLERENT CONTRACT
  // ========================================
  
  console.log("📦 Deploying StableRentSubscription...");
  console.log("   Using PYUSD address:", PYUSD_ADDRESS);
  
  const StableRentSubscription = await ethers.getContractFactory("StableRentSubscription");
  const stableRent = await StableRentSubscription.deploy(
    deployer.address, // initialOwner
    PYUSD_ADDRESS     // PYUSD token address on Sepolia
  );
  
  console.log("⏳ Waiting for deployment transaction to be mined...");
  await stableRent.waitForDeployment();
  
  const stableRentAddress = await stableRent.getAddress();
  
  console.log("✅ StableRentSubscription deployed to:", stableRentAddress);
  console.log("");

  // ========================================
  // VERIFY DEPLOYMENT
  // ========================================
  
  console.log("🔍 Verifying deployment...");
  
  // Check PYUSD token address is set correctly
  const pyusdToken = await stableRent.pyusdToken();
  console.log("   ✓ PYUSD Token Address:", pyusdToken);
  
  // Check owner is set correctly
  const owner = await stableRent.owner();
  console.log("   ✓ Contract Owner:", owner);
  
  // Verify PYUSD token exists and is accessible
  try {
    const PyusdContract = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      PYUSD_ADDRESS
    );
    const deployerPyusdBalance = await PyusdContract.balanceOf(deployer.address);
    console.log("   ✓ Your PYUSD Balance:", ethers.formatUnits(deployerPyusdBalance, 6), "PYUSD");
    
    if (deployerPyusdBalance === 0n) {
      console.log("\n⚠️  You have no PYUSD! Get testnet PYUSD from the faucet");
      console.log("   (You found a faucet - use that to get PYUSD tokens)");
    }
  } catch (error) {
    console.log("   ⚠️  Could not verify PYUSD token (this is okay, contract still deployed)");
  }
  
  console.log("✅ Verification complete!\n");

  // ========================================
  // SAVE DEPLOYMENT INFO
  // ========================================
  
  const deploymentInfo = {
    network: "sepolia",
    chainId: network.chainId.toString(),
    contracts: {
      StableRentSubscription: stableRentAddress,
      PYUSD: PYUSD_ADDRESS
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    explorerUrl: `https://sepolia.etherscan.io/address/${stableRentAddress}`
  };
  
  // Save to file
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, 'sepolia.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log("");

  // ========================================
  // FRONTEND CONFIGURATION
  // ========================================
  
  console.log("============================================================================");
  console.log("📋 FRONTEND CONFIGURATION");
  console.log("============================================================================");
  console.log("");
  console.log("Add these to your frontend/.env file:");
  console.log("");
  console.log(`VITE_CONTRACT_ADDRESS=${stableRentAddress}`);
  console.log(`VITE_PYUSD_ADDRESS=${PYUSD_ADDRESS}`);
  console.log(`VITE_DEFAULT_CHAIN=sepolia`);
  console.log(`VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`);
  console.log("");
  console.log("Or run these commands:");
  console.log("");
  console.log(`echo "VITE_CONTRACT_ADDRESS=${stableRentAddress}" > frontend/.env`);
  console.log(`echo "VITE_PYUSD_ADDRESS=${PYUSD_ADDRESS}" >> frontend/.env`);
  console.log(`echo "VITE_DEFAULT_CHAIN=sepolia" >> frontend/.env`);
  console.log(`echo "VITE_SEPOLIA_RPC_URL=YOUR_RPC_URL_HERE" >> frontend/.env`);
  console.log("");
  console.log("============================================================================");
  console.log("");

  // ========================================
  // BACKEND CONFIGURATION
  // ========================================
  
  console.log("============================================================================");
  console.log("📋 BACKEND CONFIGURATION");
  console.log("============================================================================");
  console.log("");
  console.log("Add these to your backend/.env file:");
  console.log("");
  console.log(`CONTRACT_ADDRESS=${stableRentAddress}`);
  console.log(`DEFAULT_CHAIN_ID=11155111`);
  console.log("");
  console.log("============================================================================");
  console.log("");

  // ========================================
  // ETHERSCAN VERIFICATION
  // ========================================
  
  console.log("============================================================================");
  console.log("🔍 ETHERSCAN VERIFICATION");
  console.log("============================================================================");
  console.log("");
  console.log("View your contract on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${stableRentAddress}`);
  console.log("");
  console.log("To verify source code on Etherscan (makes it readable for judges!):");
  console.log("");
  console.log("1. Get free Etherscan API key from: https://etherscan.io/myapikey");
  console.log("2. Add to .env file: ETHERSCAN_API_KEY=your_api_key");
  console.log("3. Run this command:");
  console.log("");
  console.log(`npx hardhat verify --network sepolia ${stableRentAddress} "${deployer.address}" "${PYUSD_ADDRESS}"`);
  console.log("");
  console.log("============================================================================");
  console.log("");

  // ========================================
  // METAMASK CONFIGURATION
  // ========================================
  
  console.log("============================================================================");
  console.log("🦊 METAMASK CONFIGURATION");
  console.log("============================================================================");
  console.log("");
  console.log("MetaMask should auto-detect Sepolia network, but if not:");
  console.log("");
  console.log("Network Name:    Sepolia");
  console.log("RPC URL:         https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY");
  console.log("Chain ID:        11155111");
  console.log("Currency Symbol: ETH");
  console.log("Block Explorer:  https://sepolia.etherscan.io");
  console.log("");
  console.log("Get Sepolia ETH from:");
  console.log("  - https://sepoliafaucet.com/");
  console.log("  - https://www.alchemy.com/faucets/ethereum-sepolia");
  console.log("");
  console.log("Get PYUSD testnet tokens from your faucet!");
  console.log("");
  console.log("============================================================================");
  console.log("");

  // ========================================
  // NEXT STEPS
  // ========================================
  
  console.log("✅ Deployment complete!");
  console.log("");
  console.log("💡 NEXT STEPS:");
  console.log("  1. ✅ Contract deployed to Sepolia");
  console.log("  2. 📝 Update frontend/.env with contract addresses (see above)");
  console.log("  3. 📝 Update backend/.env with contract address (see above)");
  console.log("  4. 🔍 Verify contract on Etherscan (optional but recommended)");
  console.log("  5. 💰 Get PYUSD testnet tokens from faucet");
  console.log("  6. 🚀 Deploy frontend to Vercel/Netlify");
  console.log("  7. 🚀 Deploy backend to Vercel/Render/Railway");
  console.log("  8. 📊 Deploy Envio indexer to hosted service");
  console.log("  9. 🧪 Test full flow on Sepolia!");
  console.log("");
  console.log("📄 Deployment details saved to: deployments/sepolia.json");
  console.log("");
}

// ========================================
// MAIN EXECUTION
// ========================================

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED\n");
    console.error(error);
    process.exit(1);
  });

