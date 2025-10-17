// ========================================
// IMPORTS
// ========================================

import { ethers } from "hardhat";

/**
 * ============================================================
 * STABLERENT DEPLOYMENT SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Deploys the StableRentSubscription contract to the local network
 * 
 * HOW TO RUN:
 * npx hardhat run scripts/deploy.ts --network localhost
 * 
 * WHAT IT DOES:
 * 1. Deploys StableRentSubscription contract
 * 2. Saves deployment addresses to a file
 * 3. Displays contract addresses for frontend configuration
 */

async function main() {
  console.log("🚀 Deploying StableRent Contracts...\n");

  // ========================================
  // CONFIGURATION
  // ========================================
  
  // PYUSD contract address on Ethereum mainnet
  const PYUSD_ADDRESS = "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8";
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ========================================
  // DEPLOY STABLERENT CONTRACT
  // ========================================
  
  console.log("📦 Deploying StableRentSubscription...");
  
  const StableRentSubscription = await ethers.getContractFactory("StableRentSubscription");
  const stableRent = await StableRentSubscription.deploy(
    deployer.address, // initialOwner
    PYUSD_ADDRESS     // PYUSD token address
  );
  
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
  console.log("   PYUSD Token Address:", pyusdToken);
  
  // Check owner is set correctly
  const owner = await stableRent.owner();
  console.log("   Contract Owner:", owner);
  
  console.log("✅ Verification complete!\n");

  // ========================================
  // SAVE DEPLOYMENT INFO
  // ========================================
  
  const fs = require('fs');
  const path = require('path');
  
  const deploymentInfo = {
    network: "localhost",
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      StableRentSubscription: stableRentAddress,
      PYUSD: PYUSD_ADDRESS
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  // Save to file
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, 'localhost.json');
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
  console.log("Add this to your frontend/.env file:");
  console.log("");
  console.log(`VITE_CONTRACT_ADDRESS=${stableRentAddress}`);
  console.log(`VITE_PYUSD_ADDRESS=${PYUSD_ADDRESS}`);
  console.log("");
  console.log("Or run these commands:");
  console.log("");
  console.log(`echo "VITE_CONTRACT_ADDRESS=${stableRentAddress}" >> frontend/.env`);
  console.log(`echo "VITE_PYUSD_ADDRESS=${PYUSD_ADDRESS}" >> frontend/.env`);
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
  console.log("To connect MetaMask to your local Hardhat node:");
  console.log("");
  console.log("1. Open MetaMask");
  console.log("2. Click network dropdown → Add Network → Add a network manually");
  console.log("3. Enter these details:");
  console.log("");
  console.log("   Network Name:    Hardhat Local");
  console.log("   RPC URL:         http://localhost:8545");
  console.log("   Chain ID:        31337");
  console.log("   Currency Symbol: ETH");
  console.log("");
  console.log("4. Import test account (has 10,000 ETH):");
  console.log("");
  console.log("   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("");
  console.log("============================================================================");
  console.log("");

  // ========================================
  // NEXT STEPS
  // ========================================
  
  console.log("✅ Deployment complete!");
  console.log("");
  console.log("💡 NEXT STEPS:");
  console.log("  1. Configure frontend with contract address (see above)");
  console.log("  2. Connect MetaMask to localhost:8545 (see above)");
  console.log("  3. Import test account to MetaMask");
  console.log("  4. Get test PYUSD by impersonating a whale:");
  console.log("     • See test/helpers/setup.ts for examples");
  console.log("  5. Start using the frontend!");
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
    console.error(error);
    process.exit(1);
  });

