import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Test Gelato automation status
 * Checks resolver, executor, and current state
 */

async function main() {
  console.log("\n🤖 Testing Gelato Automation Status\n");
  
  // Load deployment addresses
  const network = await ethers.provider.getNetwork();
  const networkName = "sepolia"; // hardcoded for now
  const deploymentsPath = path.join(__dirname, "../deployments", `${networkName}.json`);
  
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("❌ No deployments found!");
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  
  console.log("📋 Contract Addresses:");
  console.log("  Subscription:", deployments.StableRentSubscription);
  console.log("  Resolver:", deployments.GelatoResolver);
  console.log("  Executor:", deployments.GelatoExecutor);
  console.log("");
  
  // Get contract instances
  const resolver = await ethers.getContractAt(
    "SubscriptionResolver", 
    deployments.GelatoResolver
  );
  
  const executor = await ethers.getContractAt(
    "SubscriptionExecutor",
    deployments.GelatoExecutor
  );
  
  console.log("=".repeat(60));
  console.log("📊 CURRENT STATUS");
  console.log("=".repeat(60));
  
  // Check payments due
  try {
    const dueCount = await resolver.getPaymentsDueCount();
    console.log("\n💰 Payments Due:", dueCount.toString());
    
    if (dueCount > 0n) {
      const dueList = await resolver.getPaymentsDueList();
      console.log("   Subscription IDs:", dueList.map(id => id.toString()).join(", "));
    }
  } catch (e: any) {
    console.log("❌ Error checking payments due:", e.message);
  }
  
  // Check resolver checker function
  try {
    const [canExec, payload] = await resolver.checker();
    console.log("\n✅ Resolver Check:");
    console.log("   Can Execute:", canExec);
    console.log("   Payload Length:", payload.length, "bytes");
    
    if (canExec) {
      console.log("   🎯 Ready for Gelato to execute!");
    } else {
      console.log("   ⏳ Waiting for subscriptions to become due...");
    }
  } catch (e: any) {
    console.log("❌ Error checking resolver:", e.message);
  }
  
  // Check executor stats
  try {
    const [processed, batches, failures] = await executor.getStats();
    console.log("\n📈 Executor Stats:");
    console.log("   Total Processed:", processed.toString(), "payments");
    console.log("   Total Batches:", batches.toString());
    console.log("   Total Failures:", failures.toString());
    
    if (processed > 0n) {
      const failureRate = (Number(failures) / Number(processed) * 100).toFixed(2);
      console.log("   Success Rate:", (100 - parseFloat(failureRate)).toFixed(2) + "%");
    }
  } catch (e: any) {
    console.log("❌ Error checking stats:", e.message);
  }
  
  // Check Gelato executor address
  try {
    const gelatoAddr = await executor.gelatoExecutor();
    console.log("\n🤖 Authorized Gelato Executor:", gelatoAddr);
  } catch (e: any) {
    console.log("❌ Error checking Gelato address:", e.message);
  }
  
  // Check recent events
  try {
    console.log("\n📡 Recent Activity (last 1000 blocks):");
    const currentBlock = await ethers.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    const batchEvents = await executor.queryFilter(
      executor.filters.BatchProcessed(),
      fromBlock,
      currentBlock
    );
    
    if (batchEvents.length > 0) {
      console.log(`   Found ${batchEvents.length} batch execution(s):`);
      batchEvents.slice(-5).forEach((event: any) => {
        console.log(`   - Batch ${event.args.batchId}: ${event.args.successCount} success, ${event.args.failureCount} failures`);
      });
    } else {
      console.log("   No executions yet (this is normal for new deployments)");
    }
  } catch (e: any) {
    console.log("   Could not fetch events:", e.message);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("🎯 NEXT STEPS");
  console.log("=".repeat(60));
  console.log("\n1. Create Gelato Task:");
  console.log("   👉 https://app.gelato.network/");
  console.log("   👉 See GELATO_SETUP.md for step-by-step guide");
  console.log("");
  console.log("2. Create Test Subscription:");
  console.log("   👉 Use frontend: https://stablerent.vercel.app/");
  console.log("   👉 Set SHORT interval (5 minutes) for testing");
  console.log("");
  console.log("3. Monitor Execution:");
  console.log("   👉 Gelato dashboard");
  console.log("   👉 Etherscan events");
  console.log("   👉 Run this script again to see stats");
  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

