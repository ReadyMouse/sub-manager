import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for Gelato Automation contracts
 * 
 * This script:
 * 1. Deploys SubscriptionResolver contract
 * 2. Deploys SubscriptionExecutor contract
 * 3. Saves deployment addresses to JSON file
 * 4. Verifies contracts on block explorer (if on live network)
 * 
 * Usage:
 *   npx hardhat run gelato-automation/scripts/deploy-automation.ts --network localhost
 *   npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia
 *   npx hardhat run gelato-automation/scripts/deploy-automation.ts --network mainnet
 */

async function main() {
  console.log("\n🚀 Deploying Gelato Automation System...\n");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");
  
  // ========================================
  // CONFIGURATION
  // ========================================
  
  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log("🌐 Network:", networkName, `(Chain ID: ${network.chainId})\n`);
  
  // Load existing deployment addresses
  const deploymentsPath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  let deployments: any = {};
  
  if (fs.existsSync(deploymentsPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
    console.log("📂 Loaded existing deployments from:", deploymentsPath);
  } else {
    console.log("⚠️  No existing deployments found, starting fresh");
  }
  
  // Validate subscription contract exists
  const subscriptionContractAddress = deployments.StableRentSubscription;
  if (!subscriptionContractAddress) {
    throw new Error("❌ StableRentSubscription contract not deployed yet. Deploy main contract first!");
  }
  console.log("✅ Subscription contract found at:", subscriptionContractAddress, "\n");
  
  // ========================================
  // GELATO CONFIGURATION
  // ========================================
  
  // Gelato Executor addresses by network
  // Source: https://docs.gelato.network/developer-services/automate/contract-deployments
  const GELATO_EXECUTORS: Record<string, string> = {
    // Mainnets
    mainnet: "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6",
    polygon: "0x527a819db1eb0e34426297b03bae11F2f8B3A19E",
    arbitrum: "0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146",
    optimism: "0x01051113D81D7d6DA508462F2ad6d7fD96cF42Ef",
    avalanche: "0x8aB6aDbC1fec4F18617C9B889F5cE7F28401B8dB",
    base: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
    // Testnets
    sepolia: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
    goerli: "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0",
    mumbai: "0x25adc84f8B4394094aa6A80E3fdEaf5B8c06d01e",
    // Local development
    localhost: deployer.address, // Use deployer as Gelato for local testing
    hardhat: deployer.address,
  };
  
  const gelatoExecutor = GELATO_EXECUTORS[networkName] || deployer.address;
  console.log("🤖 Gelato Executor address:", gelatoExecutor);
  
  if (gelatoExecutor === deployer.address && networkName !== "localhost" && networkName !== "hardhat") {
    console.log("⚠️  WARNING: Using deployer as Gelato executor (not recommended for production!)");
  }
  
  // ========================================
  // DEPLOYMENT CONFIGURATION
  // ========================================
  
  // Maximum batch size for processing subscriptions
  // Adjust based on gas limits and expected load
  const MAX_BATCH_SIZE = 50; // Process up to 50 subscriptions per batch
  
  console.log("⚙️  Configuration:");
  console.log("   - Subscription Contract:", subscriptionContractAddress);
  console.log("   - Max Batch Size:", MAX_BATCH_SIZE);
  console.log("   - Gelato Executor:", gelatoExecutor);
  console.log("   - Initial Owner:", deployer.address);
  console.log("");
  
  // ========================================
  // DEPLOY RESOLVER
  // ========================================
  
  console.log("📦 Deploying SubscriptionResolver...");
  const ResolverFactory = await ethers.getContractFactory("SubscriptionResolver");
  const resolver = await ResolverFactory.deploy(
    subscriptionContractAddress,
    MAX_BATCH_SIZE
  );
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  
  console.log("✅ SubscriptionResolver deployed to:", resolverAddress);
  console.log("   - Gas used:", (await resolver.deploymentTransaction()?.wait())?.gasUsed.toString());
  console.log("");
  
  // ========================================
  // DEPLOY EXECUTOR
  // ========================================
  
  console.log("📦 Deploying SubscriptionExecutor...");
  const ExecutorFactory = await ethers.getContractFactory("SubscriptionExecutor");
  const executor = await ExecutorFactory.deploy(
    deployer.address, // initial owner
    subscriptionContractAddress,
    gelatoExecutor
  );
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();
  
  console.log("✅ SubscriptionExecutor deployed to:", executorAddress);
  console.log("   - Gas used:", (await executor.deploymentTransaction()?.wait())?.gasUsed.toString());
  console.log("");
  
  // ========================================
  // SAVE DEPLOYMENT ADDRESSES
  // ========================================
  
  deployments.GelatoResolver = resolverAddress;
  deployments.GelatoExecutor = executorAddress;
  deployments.GelatoExecutorAddress = gelatoExecutor; // For reference
  deployments.lastDeployment = new Date().toISOString();
  
  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(deploymentsPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("💾 Deployment addresses saved to:", deploymentsPath);
  console.log("");
  
  // ========================================
  // VERIFICATION (for live networks)
  // ========================================
  
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log("\n🔍 Verifying contracts on block explorer...");
    
    try {
      await hre.run("verify:verify", {
        address: resolverAddress,
        constructorArguments: [
          subscriptionContractAddress,
          MAX_BATCH_SIZE
        ],
      });
      console.log("✅ SubscriptionResolver verified");
    } catch (error: any) {
      console.log("⚠️  Resolver verification failed:", error.message);
    }
    
    try {
      await hre.run("verify:verify", {
        address: executorAddress,
        constructorArguments: [
          deployer.address,
          subscriptionContractAddress,
          gelatoExecutor
        ],
      });
      console.log("✅ SubscriptionExecutor verified");
    } catch (error: any) {
      console.log("⚠️  Executor verification failed:", error.message);
    }
  }
  
  // ========================================
  // DEPLOYMENT SUMMARY
  // ========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 Contract Addresses:");
  console.log("   Subscription Contract:", subscriptionContractAddress);
  console.log("   Gelato Resolver:      ", resolverAddress);
  console.log("   Gelato Executor:      ", executorAddress);
  console.log("\n🔧 Next Steps:");
  console.log("   1. Create Gelato Task at https://app.gelato.network/");
  console.log("      - Target Contract: ", executorAddress);
  console.log("      - Resolver Contract: ", resolverAddress);
  console.log("      - Function: processPayments(uint256[])");
  console.log("   2. Fund Gelato 1Balance with ETH/MATIC for gas");
  console.log("   3. Test automation with: npm run test:gelato");
  console.log("   4. Monitor execution in Gelato dashboard");
  console.log("\n📚 Documentation:");
  console.log("   - Integration Guide: gelato-automation/docs/INTEGRATION_GUIDE.md");
  console.log("   - Testing Guide: gelato-automation/docs/TESTING_GUIDE.md");
  console.log("\n" + "=".repeat(70) + "\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

