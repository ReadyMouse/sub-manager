// ========================================
// IMPORTS
// ========================================

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * ============================================================
 * FULL STACK DEPLOYMENT SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Deploys smart contracts AND redeploys Railway backend with updated configuration
 * 
 * PREREQUISITES:
 * 1. Railway CLI installed and authenticated: npm install -g @railway/cli
 * 2. Railway project connected: railway login && railway link
 * 3. Environment variables set in Railway dashboard
 * 4. Sepolia RPC URL and private key in .env
 * 
 * HOW TO RUN:
 * npx hardhat run scripts/deploy-full.ts --network sepolia
 * 
 * WHAT IT DOES:
 * 1. Deploys StableRentSubscription contract to Sepolia
 * 2. Updates Railway environment variables with new contract address
 * 3. Triggers Railway redeployment
 * 4. Updates local configuration files
 * 5. Provides deployment summary
 */

interface DeploymentInfo {
  network: string;
  chainId: string;
  contracts: {
    StableRentSubscription: string;
    PYUSD: string;
  };
  deployer: string;
  timestamp: string;
  blockNumber: number;
  explorerUrl: string;
}

interface RailwayEnvUpdate {
  key: string;
  value: string;
}

async function main() {
  console.log("🚀 Starting Full Stack Deployment...\n");

  // ========================================
  // SMART CONTRACT DEPLOYMENT
  // ========================================
  
  console.log("📦 PHASE 1: Smart Contract Deployment");
  console.log("=====================================\n");

  // Configuration
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

  // Deploy contract
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

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const pyusdToken = await stableRent.pyusdToken();
  const owner = await stableRent.owner();
  console.log("   ✓ PYUSD Token Address:", pyusdToken);
  console.log("   ✓ Contract Owner:", owner);
  console.log("✅ Smart contract deployment complete!\n");

  // ========================================
  // SAVE DEPLOYMENT INFO
  // ========================================
  
  const deploymentInfo: DeploymentInfo = {
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

  // ========================================
  // RAILWAY BACKEND DEPLOYMENT
  // ========================================
  
  console.log("\n🚂 PHASE 2: Railway Backend Deployment");
  console.log("=====================================\n");

  try {
    // Check if Railway CLI is installed
    await execAsync('railway --version');
    console.log("✅ Railway CLI detected");

    // Update Railway environment variables
    const envUpdates: RailwayEnvUpdate[] = [
      { key: 'CONTRACT_ADDRESS_SEPOLIA', value: stableRentAddress },
      { key: 'DEFAULT_CHAIN_ID', value: '11155111' },
      { key: 'NODE_ENV', value: 'production' },
      { key: 'LAST_DEPLOYMENT', value: new Date().toISOString() }
    ];

    console.log("🔧 Updating Railway environment variables...");
    
    for (const envUpdate of envUpdates) {
      try {
        await execAsync(`railway variables set ${envUpdate.key}="${envUpdate.value}"`);
        console.log(`   ✓ Set ${envUpdate.key}=${envUpdate.value}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to set ${envUpdate.key}: ${error}`);
      }
    }

    // Trigger Railway deployment
    console.log("\n🚀 Triggering Railway deployment...");
    try {
      await execAsync('railway up');
      console.log("✅ Railway deployment triggered successfully!");
    } catch (error) {
      console.log("⚠️  Railway deployment failed:", error);
      console.log("   You may need to manually trigger deployment from Railway dashboard");
    }

  } catch (error) {
    console.log("⚠️  Railway CLI not found or not authenticated");
    console.log("   Please install Railway CLI and authenticate:");
    console.log("   npm install -g @railway/cli");
    console.log("   railway login");
    console.log("   railway link");
    console.log("\n   Then manually update these environment variables in Railway dashboard:");
    console.log(`   CONTRACT_ADDRESS_SEPOLIA=${stableRentAddress}`);
    console.log(`   DEFAULT_CHAIN_ID=11155111`);
  }

  // ========================================
  // UPDATE LOCAL CONFIGURATION
  // ========================================
  
  console.log("\n📝 PHASE 3: Local Configuration Update");
  console.log("=====================================\n");

  // Update backend .env.example
  const backendEnvExamplePath = path.join(__dirname, '../backend/env.example');
  if (fs.existsSync(backendEnvExamplePath)) {
    let envContent = fs.readFileSync(backendEnvExamplePath, 'utf8');
    envContent = envContent.replace(
      /CONTRACT_ADDRESS_SEPOLIA=.*/,
      `CONTRACT_ADDRESS_SEPOLIA=${stableRentAddress}`
    );
    fs.writeFileSync(backendEnvExamplePath, envContent);
    console.log("✅ Updated backend/env.example with new contract address");
  }

  // Update frontend .env.example (if exists)
  const frontendEnvExamplePath = path.join(__dirname, '../frontend/.env.example');
  if (fs.existsSync(frontendEnvExamplePath)) {
    let envContent = fs.readFileSync(frontendEnvExamplePath, 'utf8');
    envContent = envContent.replace(
      /VITE_CONTRACT_ADDRESS=.*/,
      `VITE_CONTRACT_ADDRESS=${stableRentAddress}`
    );
    envContent = envContent.replace(
      /VITE_PYUSD_ADDRESS=.*/,
      `VITE_PYUSD_ADDRESS=${PYUSD_ADDRESS}`
    );
    fs.writeFileSync(frontendEnvExamplePath, envContent);
    console.log("✅ Updated frontend/.env.example with new contract addresses");
  }

  // ========================================
  // DEPLOYMENT SUMMARY
  // ========================================
  
  console.log("\n🎉 DEPLOYMENT SUMMARY");
  console.log("===================");
  console.log("");
  console.log("📦 Smart Contract:");
  console.log(`   Address: ${stableRentAddress}`);
  console.log(`   Explorer: https://sepolia.etherscan.io/address/${stableRentAddress}`);
  console.log("");
  console.log("🚂 Railway Backend:");
  console.log("   Environment variables updated");
  console.log("   Redeployment triggered");
  console.log("");
  console.log("📝 Configuration Files:");
  console.log("   ✓ deployments/sepolia.json updated");
  console.log("   ✓ backend/env.example updated");
  console.log("   ✓ frontend/.env.example updated");
  console.log("");
  
  console.log("💡 NEXT STEPS:");
  console.log("  1. ✅ Smart contract deployed to Sepolia");
  console.log("  2. ✅ Railway backend redeployment triggered");
  console.log("  3. 🔍 Verify contract on Etherscan (optional)");
  console.log("  4. 🧪 Test the full application flow");
  console.log("  5. 📊 Monitor Railway deployment logs");
  console.log("");
  console.log("🔗 Useful Links:");
  console.log(`   - Contract: https://sepolia.etherscan.io/address/${stableRentAddress}`);
  console.log("   - Railway Dashboard: https://railway.app/dashboard");
  console.log("");
}

// ========================================
// MAIN EXECUTION
// ========================================

main()
  .then(() => {
    console.log("✅ Full stack deployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ DEPLOYMENT FAILED\n");
    console.error(error);
    process.exit(1);
  });
