// ========================================
// RAILWAY DEPLOYMENT HELPER SCRIPT
// ========================================

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const execAsync = promisify(exec);

/**
 * ============================================================
 * RAILWAY DEPLOYMENT HELPER
 * ============================================================
 * 
 * PURPOSE:
 * Helper script to deploy backend to Railway with updated configuration
 * 
 * PREREQUISITES:
 * 1. Railway CLI installed: npm install -g @railway/cli
 * 2. Railway project linked: railway link
 * 3. Contract address from deployments/sepolia.json
 * 
 * HOW TO RUN:
 * npx ts-node scripts/railway-deploy.ts
 * 
 * WHAT IT DOES:
 * 1. Reads latest contract address from deployments/sepolia.json
 * 2. Updates Railway environment variables
 * 3. Triggers Railway redeployment
 * 4. Provides deployment status
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

async function main() {
  console.log("🚂 Railway Backend Deployment Helper");
  console.log("=====================================\n");

  try {
    // Check if Railway CLI is installed
    await execAsync('railway --version');
    console.log("✅ Railway CLI detected");
  } catch (error) {
    console.log("❌ Railway CLI not found!");
    console.log("   Please install Railway CLI first:");
    console.log("   npm install -g @railway/cli");
    console.log("   railway login");
    console.log("   railway link");
    process.exit(1);
  }

  // Read deployment info
  const deploymentFile = path.join(__dirname, '../deployments/sepolia.json');
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ No deployment info found!");
    console.log("   Please run smart contract deployment first:");
    console.log("   npm run deploy:sepolia");
    process.exit(1);
  }

  const deploymentInfo: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentFile, 'utf8')
  );

  console.log("📋 Deployment Info:");
  console.log(`   Contract: ${deploymentInfo.contracts.StableRentSubscription}`);
  console.log(`   Network: ${deploymentInfo.network}`);
  console.log(`   Deployed: ${deploymentInfo.timestamp}`);
  console.log("");

  // Update Railway environment variables
  const envUpdates = [
    { key: 'CONTRACT_ADDRESS_SEPOLIA', value: deploymentInfo.contracts.StableRentSubscription },
    { key: 'DEFAULT_CHAIN_ID', value: deploymentInfo.chainId },
    { key: 'NODE_ENV', value: 'production' },
    { key: 'LAST_DEPLOYMENT', value: new Date().toISOString() },
    // Processor fee configuration from .env
    { key: 'PROCESSOR_FEE_ADDRESS', value: process.env.PROCESSOR_FEE_ADDRESS || '0x17A4bAf74aC19ab1254fc24D7DcED2ad7639451b' },
    { key: 'PROCESSOR_FEE_PERCENT', value: process.env.PROCESSOR_FEE_PERCENT || '0.05' },
    { key: 'PROCESSOR_FEE_CURRENCY', value: process.env.PROCESSOR_FEE_CURRENCY || 'PYUSD' },
    { key: 'PROCESSOR_FEE_ID', value: process.env.PROCESSOR_FEE_ID || '1' }
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
    console.log("\n📊 You can monitor the deployment at:");
    console.log("   https://railway.app/dashboard");
  } catch (error) {
    console.log("⚠️  Railway deployment failed:", error);
    console.log("   You may need to manually trigger deployment from Railway dashboard");
  }

  console.log("\n✅ Railway deployment process complete!");
}

main().catch((error) => {
  console.error("\n❌ RAILWAY DEPLOYMENT FAILED\n");
  console.error(error);
  process.exit(1);
});
