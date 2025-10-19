import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Helper script to generate Gelato task configuration
 * 
 * This script generates the necessary information to create a Gelato task
 * via the Gelato dashboard or API.
 * 
 * Usage:
 *   npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network sepolia
 */

async function main() {
  console.log("\n🤖 Gelato Task Configuration Generator\n");
  
  // Get network name
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log("🌐 Network:", networkName, `(Chain ID: ${network.chainId})\n`);
  
  // Load deployment addresses
  const deploymentsPath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("❌ No deployments found. Run deploy-automation.ts first!");
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  
  const resolverAddress = deployments.GelatoResolver;
  const executorAddress = deployments.GelatoExecutor;
  const subscriptionAddress = deployments.StableRentSubscription;
  
  if (!resolverAddress || !executorAddress || !subscriptionAddress) {
    throw new Error("❌ Missing contract addresses in deployment file");
  }
  
  console.log("📋 Contract Addresses:");
  console.log("   Subscription Contract:", subscriptionAddress);
  console.log("   Gelato Resolver:      ", resolverAddress);
  console.log("   Gelato Executor:      ", executorAddress);
  console.log("");
  
  // ========================================
  // GELATO TASK CONFIGURATION
  // ========================================
  
  console.log("=".repeat(70));
  console.log("📝 GELATO TASK CONFIGURATION");
  console.log("=".repeat(70));
  console.log("\n🌐 Go to: https://app.gelato.network/");
  console.log("\n1️⃣  Create New Task:");
  console.log("   - Click 'Create Task' button");
  console.log("   - Select your network:", networkName);
  console.log("");
  
  console.log("2️⃣  Target Contract Configuration:");
  console.log("   - Contract Address:", executorAddress);
  console.log("   - ABI: Use SubscriptionExecutor ABI (auto-detect or upload)");
  console.log("   - Function: processPayments");
  console.log("   - Function Signature: processPayments(uint256[])");
  console.log("");
  
  console.log("3️⃣  Resolver Configuration:");
  console.log("   - Resolver Type: Custom Resolver");
  console.log("   - Resolver Address:", resolverAddress);
  console.log("   - Resolver ABI: Use SubscriptionResolver ABI");
  console.log("   - Resolver Function: checker");
  console.log("   - Resolver Signature: checker() returns (bool, bytes)");
  console.log("");
  
  console.log("4️⃣  Task Settings:");
  console.log("   - Task Name: StableRent Subscription Processor");
  console.log("   - Check Interval: 5 minutes (or your preference)");
  console.log("   - Gas Limit: 5,000,000 (adjust based on batch size)");
  console.log("   - Max Gas Price: (set based on your budget)");
  console.log("");
  
  console.log("5️⃣  Payment:");
  console.log("   - Payment Method: 1Balance");
  console.log("   - Deposit ETH/MATIC to cover gas fees");
  console.log("   - Recommended: 0.1 ETH to start");
  console.log("");
  
  // ========================================
  // API CONFIGURATION (Alternative)
  // ========================================
  
  console.log("=".repeat(70));
  console.log("🔧 ALTERNATIVE: Using Gelato SDK");
  console.log("=".repeat(70));
  console.log("\nInstall Gelato SDK:");
  console.log("   npm install @gelatonetwork/automate-sdk");
  console.log("");
  
  console.log("Example TypeScript code:");
  console.log(`
import { AutomateSDK } from "@gelatonetwork/automate-sdk";
import { ethers } from "ethers";

async function createTask() {
  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Initialize Gelato SDK
  const automate = new AutomateSDK(${network.chainId}, signer);
  
  // Create task
  const { taskId, tx } = await automate.createTask({
    execAddress: "${executorAddress}",
    execSelector: "0x...", // processPayments function selector
    resolverAddress: "${resolverAddress}",
    resolverData: "0x...", // checker function selector
    name: "StableRent Subscription Processor",
    dedicatedMsgSender: false,
    useTreasury: true,
  });
  
  console.log("Task created! Task ID:", taskId);
  console.log("Transaction:", tx.hash);
}

createTask();
  `);
  
  // ========================================
  // MONITORING & TESTING
  // ========================================
  
  console.log("\n" + "=".repeat(70));
  console.log("📊 MONITORING & TESTING");
  console.log("=".repeat(70));
  console.log("\n✅ After creating the task:");
  console.log("   1. View task in Gelato dashboard");
  console.log("   2. Check execution history");
  console.log("   3. Monitor gas usage and costs");
  console.log("   4. View task logs and errors");
  console.log("");
  
  console.log("🧪 Test locally first:");
  console.log("   npm run test:gelato");
  console.log("");
  
  console.log("📈 Monitor on-chain:");
  console.log("   - Check BatchProcessed events on executor contract");
  console.log("   - Check PaymentProcessed events on subscription contract");
  console.log("   - View stats: executor.getStats()");
  console.log("");
  
  // ========================================
  // USEFUL LINKS
  // ========================================
  
  console.log("=".repeat(70));
  console.log("🔗 USEFUL LINKS");
  console.log("=".repeat(70));
  console.log("\n📚 Documentation:");
  console.log("   - Gelato Docs: https://docs.gelato.network/");
  console.log("   - Gelato Dashboard: https://app.gelato.network/");
  console.log("   - Gelato SDK: https://github.com/gelatodigital/automate-sdk");
  console.log("");
  
  console.log("🔍 Block Explorers:");
  if (networkName === "mainnet") {
    console.log("   - Etherscan: https://etherscan.io/address/" + executorAddress);
  } else if (networkName === "sepolia") {
    console.log("   - Etherscan: https://sepolia.etherscan.io/address/" + executorAddress);
  } else if (networkName === "polygon") {
    console.log("   - Polygonscan: https://polygonscan.com/address/" + executorAddress);
  }
  console.log("");
  
  console.log("💡 Tips:");
  console.log("   - Start with a small test subscription");
  console.log("   - Monitor gas costs for 24 hours before scaling");
  console.log("   - Set reasonable gas price limits");
  console.log("   - Keep 1Balance funded to avoid task pausing");
  console.log("   - Use Gelato's notification features for alerts");
  console.log("\n" + "=".repeat(70) + "\n");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

