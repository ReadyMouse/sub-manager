# Gelato Automation Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Deployment](#deployment)
6. [Creating Gelato Tasks](#creating-gelato-tasks)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Cost Estimation](#cost-estimation)

---

## Overview

This guide walks you through integrating Gelato Network automation with the StableRent subscription payment system. Gelato will automatically check for due subscriptions and process payments without manual intervention.

### What is Gelato?

Gelato Network is a decentralized automation protocol that executes smart contract functions based on custom conditions. It acts as a decentralized "cron job" service for blockchain.

### How it Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Gelato Automation Flow                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Gelato calls Resolver.checker() every N seconds
        ↓
Step 2: Resolver checks SubscriptionContract.getPaymentsDue()
        ↓
Step 3: If payments due, Resolver returns (true, execData)
        ↓
Step 4: Gelato triggers Executor.processPayments(subscriptionIds)
        ↓
Step 5: Executor processes each payment via SubscriptionContract
        ↓
Step 6: Events emitted → Users notified → Payment complete ✅
```

### Benefits

- ✅ **Set and Forget**: No manual payment processing needed
- ✅ **24/7 Uptime**: Gelato monitors subscriptions around the clock
- ✅ **Decentralized**: No single point of failure
- ✅ **Cost Effective**: Pay only for gas used (no subscription fees)
- ✅ **Reliable**: Built on battle-tested infrastructure
- ✅ **Scalable**: Handles 1 to 1000+ subscriptions seamlessly

---

## Prerequisites

### Required Knowledge
- Solidity smart contracts
- Hardhat development environment
- Ethereum transaction basics
- Basic understanding of Gelato Network

### Required Tools
- Node.js 18+ and npm
- Hardhat 3.0+
- MetaMask or hardware wallet
- Alchemy/Infura API key
- Etherscan API key (for verification)

### Required Funds
- ETH/MATIC for gas fees (deposited to Gelato 1Balance)
- Initial estimate: 0.1 ETH for testing, 1+ ETH for production

---

## Architecture

### Contract Structure

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  SubscriptionContract (Main)                       │
│  - createSubscription()                            │
│  - processPayment()                                │
│  - getPaymentsDue()  ← Resolver queries this      │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↑
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────────────┐              ┌─────────────────┐
│   Resolver    │              │    Executor     │
│  (View Only)  │              │  (Processes)    │
├───────────────┤              ├─────────────────┤
│ - checker()   │─────────────→│ - processPayments│
│               │  (returns)   │                 │
│               │  execData    │                 │
└───────────────┘              └─────────────────┘
        ↑                               ↑
        │                               │
        └───────────┬───────────────────┘
                    │
            ┌───────────────┐
            │ Gelato Network│
            │   (Off-chain) │
            └───────────────┘
```

### Key Contracts

1. **SubscriptionResolver.sol**
   - Checks if subscriptions are due
   - Returns list of subscription IDs to process
   - Read-only, no state changes
   - Optimized for gas-free off-chain calls

2. **SubscriptionExecutor.sol**
   - Processes subscription payments in batches
   - Handles errors gracefully
   - Tracks statistics
   - Only callable by Gelato or owner

3. **StableRentSubscription.sol** (Existing)
   - Core subscription logic
   - Payment processing
   - Already has `getPaymentsDue()` function!

---

## Step-by-Step Integration

### Step 1: Deploy Contracts

```bash
# Navigate to project root
cd /Users/mouse/src/sub-manager

# Deploy automation contracts
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia
```

**What this does:**
- Deploys `SubscriptionResolver` contract
- Deploys `SubscriptionExecutor` contract
- Saves addresses to `deployments/sepolia.json`
- Verifies contracts on Etherscan

**Expected Output:**
```
🚀 Deploying Gelato Automation System...

📝 Deploying with account: 0x...
💰 Account balance: 1.5 ETH

🌐 Network: sepolia (Chain ID: 11155111)

📂 Loaded existing deployments
✅ Subscription contract found at: 0x...

📦 Deploying SubscriptionResolver...
✅ SubscriptionResolver deployed to: 0x...

📦 Deploying SubscriptionExecutor...
✅ SubscriptionExecutor deployed to: 0x...

💾 Deployment addresses saved to: deployments/sepolia.json

🔍 Verifying contracts on block explorer...
✅ SubscriptionResolver verified
✅ SubscriptionExecutor verified

🎉 DEPLOYMENT COMPLETE!
```

### Step 2: Verify Deployment

```bash
# Check deployment addresses
cat deployments/sepolia.json

# Should show:
# {
#   "StableRentSubscription": "0x...",
#   "GelatoResolver": "0x...",
#   "GelatoExecutor": "0x..."
# }
```

### Step 3: Get Gelato Task Configuration

```bash
# Generate Gelato task configuration
npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network sepolia
```

This will output detailed instructions and configuration for creating your Gelato task.

### Step 4: Create Gelato Task

#### Option A: Using Gelato Dashboard (Recommended for first-time users)

1. **Go to Gelato App**
   - Visit: https://app.gelato.network/
   - Connect your wallet (same account that deployed contracts)

2. **Create New Task**
   - Click "Create Task" button
   - Select network: `Sepolia` (or your network)

3. **Configure Target Contract**
   - **Contract Address**: `[Your GelatoExecutor address]`
   - **ABI**: Upload `SubscriptionExecutor.json` or auto-detect
   - **Function**: `processPayments`
   - **Function Signature**: `processPayments(uint256[])`

4. **Configure Resolver**
   - **Resolver Type**: Custom Resolver
   - **Resolver Address**: `[Your GelatoResolver address]`
   - **Resolver ABI**: Upload `SubscriptionResolver.json`
   - **Resolver Function**: `checker`
   - **Resolver Signature**: `checker() returns (bool, bytes)`

5. **Task Settings**
   - **Task Name**: `StableRent Subscription Processor`
   - **Check Interval**: `5 minutes` (adjust based on needs)
   - **Gas Limit**: `5,000,000` (adjust based on batch size)
   - **Max Gas Price**: Set reasonable limit (e.g., 100 Gwei)

6. **Payment Method**
   - Select: **1Balance** (Gelato's gas tank)
   - Deposit ETH/MATIC to cover gas fees
   - Recommended start: `0.1 ETH`

7. **Create Task**
   - Review configuration
   - Click "Create Task"
   - Sign transaction
   - Wait for confirmation

#### Option B: Using Gelato SDK (Programmatic)

```typescript
import { AutomateSDK } from "@gelatonetwork/automate-sdk";
import { ethers } from "ethers";
import * as fs from "fs";

async function createGelatoTask() {
  // Load deployment addresses
  const deployments = JSON.parse(
    fs.readFileSync("deployments/sepolia.json", "utf-8")
  );

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Initialize Gelato SDK
  const automate = new AutomateSDK(11155111, signer); // Sepolia chain ID

  // Get function selectors
  const resolverInterface = new ethers.Interface([
    "function checker() external view returns (bool, bytes)"
  ]);
  const executorInterface = new ethers.Interface([
    "function processPayments(uint256[])"
  ]);

  const resolverData = resolverInterface.encodeFunctionData("checker");
  const execSelector = executorInterface.getFunction("processPayments")!.selector;

  // Create task
  const { taskId, tx } = await automate.createTask({
    execAddress: deployments.GelatoExecutor,
    execSelector: execSelector,
    resolverAddress: deployments.GelatoResolver,
    resolverData: resolverData,
    name: "StableRent Subscription Processor",
    dedicatedMsgSender: false,
    useTreasury: true, // Use 1Balance for gas
  });

  console.log("✅ Task created!");
  console.log("📝 Task ID:", taskId);
  console.log("🔗 Transaction:", tx.hash);

  // Wait for confirmation
  await tx.wait();
  console.log("✅ Task confirmed on-chain");
}

createGelatoTask()
  .then(() => process.exit(0))
  .catch(console.error);
```

### Step 5: Fund Gelato 1Balance

Gelato uses a prepaid gas tank called "1Balance":

1. Go to: https://app.gelato.network/balance
2. Select your network (Sepolia/Mainnet)
3. Deposit ETH/MATIC
4. Recommended amounts:
   - **Testing (Sepolia)**: 0.01 ETH
   - **Production (Mainnet)**: 1+ ETH (monitor and top up)

**Cost Estimates:**
- Per payment: ~0.001 ETH (varies by gas price)
- Per batch (10 payments): ~0.005 ETH
- Monthly (100 subscriptions): ~0.3 ETH

### Step 6: Monitor Task Execution

1. **Gelato Dashboard**
   - Visit: https://app.gelato.network/tasks
   - View your active tasks
   - Check execution history
   - Monitor gas usage

2. **On-Chain Events**
   ```typescript
   // Listen for BatchProcessed events
   const executor = await ethers.getContractAt(
     "SubscriptionExecutor",
     deployments.GelatoExecutor
   );
   
   executor.on("BatchProcessed", (batchId, successCount, failureCount, gasUsed, timestamp) => {
     console.log(`Batch ${batchId} processed:`);
     console.log(`  ✅ Success: ${successCount}`);
     console.log(`  ❌ Failures: ${failureCount}`);
     console.log(`  ⛽ Gas used: ${gasUsed}`);
   });
   ```

3. **View Statistics**
   ```typescript
   const [processed, batches, failures] = await executor.getStats();
   console.log(`Total payments processed: ${processed}`);
   console.log(`Total batches executed: ${batches}`);
   console.log(`Total failures: ${failures}`);
   ```

---

## Deployment

### Deployment Checklist

- [ ] Main subscription contract deployed
- [ ] Resolver contract deployed
- [ ] Executor contract deployed
- [ ] Contracts verified on block explorer
- [ ] Gelato task created
- [ ] 1Balance funded
- [ ] Test subscription created
- [ ] First automated payment successful

### Network-Specific Considerations

#### Sepolia (Testnet)
- Use Sepolia ETH for gas
- Get testnet ETH from faucets
- Lower gas prices
- Faster iterations for testing

#### Ethereum Mainnet
- Real ETH required
- Higher gas costs
- Monitor gas prices
- Consider gas price limits on Gelato task

#### Polygon
- Very low gas costs
- MATIC required
- Fast finality
- Great for high-frequency subscriptions

#### Arbitrum/Optimism (L2s)
- Lower gas than mainnet
- Fast and cheap
- Good middle ground

---

## Creating Gelato Tasks

### Task Configuration Options

#### Check Interval
How often Gelato calls `checker()`:
- **1 minute**: High responsiveness, higher costs
- **5 minutes**: Good balance (recommended)
- **15 minutes**: Lower costs, delayed processing
- **1 hour**: Budget-friendly for monthly subscriptions

#### Gas Limit
Maximum gas per transaction:
- **Single payment**: 500,000
- **Batch of 10**: 2,000,000
- **Batch of 50**: 5,000,000

#### Max Gas Price
Maximum Gwei to pay:
- **Mainnet**: 100 Gwei (emergency only)
- **Mainnet**: 50 Gwei (normal)
- **Polygon**: 200 Gwei
- **L2s**: Auto

### Advanced Configuration

#### Dedicated Msg.Sender
Use a dedicated proxy for consistent `msg.sender`:
```typescript
dedicatedMsgSender: true
```

**Pros:**
- Consistent caller address
- Easier access control

**Cons:**
- Extra setup
- Slight gas overhead

#### Treasury vs. Self-Pay
**1Balance (Treasury)** - Recommended:
```typescript
useTreasury: true
```
- Prepaid gas tank
- Easier accounting
- No need to fund executor contract

**Self-Pay**:
```typescript
useTreasury: false
```
- Executor contract pays gas
- More complex
- Requires funding executor

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **1Balance Level**
   - Check daily
   - Auto-alert when low (< 0.1 ETH)
   - Refill promptly

2. **Task Execution Rate**
   - Expected: proportional to subscriptions
   - Alert if drops to zero

3. **Success Rate**
   - Target: > 95%
   - Investigate failures

4. **Gas Usage**
   - Track trends
   - Optimize batch sizes

5. **Payment Failures**
   - Monitor `PaymentFailed` events
   - Alert users with low balance

### Setting Up Alerts

#### Gelato Webhooks
```typescript
// Configure webhook in Gelato dashboard
const webhookUrl = "https://your-backend.com/api/gelato-webhook";

// Receive events
app.post("/api/gelato-webhook", (req, res) => {
  const { taskId, executionId, status } = req.body;
  
  if (status === "failed") {
    // Alert admin
    sendAlert(`Gelato task ${taskId} failed`);
  }
  
  res.status(200).send("OK");
});
```

#### On-Chain Event Monitoring
```typescript
// Monitor BatchProcessed events
executor.on("BatchProcessed", async (batchId, successCount, failureCount) => {
  if (failureCount > 0) {
    console.warn(`⚠️  Batch ${batchId} had ${failureCount} failures`);
    // Investigate failures
  }
  
  // Log to database
  await db.logBatch({
    batchId,
    successCount,
    failureCount,
    timestamp: Date.now()
  });
});
```

### Maintenance Tasks

#### Weekly
- [ ] Check 1Balance level
- [ ] Review execution logs
- [ ] Monitor success rate
- [ ] Check gas usage trends

#### Monthly
- [ ] Analyze cost trends
- [ ] Optimize batch sizes
- [ ] Review failure patterns
- [ ] Update documentation

#### Quarterly
- [ ] Audit contracts
- [ ] Review Gelato pricing
- [ ] Evaluate alternative solutions
- [ ] Update security measures

---

## Troubleshooting

### Common Issues

#### 1. Task Not Executing

**Symptoms:**
- Task shows "active" but no executions
- `checker()` returns `false`

**Solutions:**
- Verify subscriptions exist and are active
- Fast-forward time in testing
- Check `getPaymentsDue()` returns data
- Verify Gelato executor has correct permissions

#### 2. Transactions Failing

**Symptoms:**
- Executions show "failed" status
- Gas reverts

**Solutions:**
- Check user has sufficient PYUSD balance
- Verify user has approved contract
- Ensure gas limit is sufficient
- Check for contract bugs

#### 3. High Gas Costs

**Symptoms:**
- 1Balance depleting quickly
- Gas usage higher than expected

**Solutions:**
- Optimize batch sizes
- Increase check intervals
- Use L2 network
- Review contract efficiency

#### 4. 1Balance Depleted

**Symptoms:**
- Task paused
- "Insufficient balance" error

**Solutions:**
- Refill 1Balance immediately
- Set up auto-refill
- Configure low-balance alerts
- Review budget

### Debug Commands

```bash
# Check resolver status
npx hardhat console --network sepolia
> const resolver = await ethers.getContractAt("SubscriptionResolver", "0x...")
> await resolver.getPaymentsDueCount()
> await resolver.getPaymentsDueList()

# Check executor stats
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> await executor.getStats()

# Manual execution (testing)
> await executor.connect(owner).processSinglePayment(1)
```

### Getting Help

- **Gelato Discord**: https://discord.gg/gelato
- **Gelato Docs**: https://docs.gelato.network/
- **GitHub Issues**: [Your repo]/issues
- **Email Support**: support@gelato.network

---

## Cost Estimation

### Gas Cost Breakdown

| Operation | Gas Used | Cost @ 50 Gwei | Cost @ 100 Gwei |
|-----------|----------|----------------|-----------------|
| Single payment | ~200k | ~0.01 ETH | ~0.02 ETH |
| Batch of 10 | ~1.5M | ~0.075 ETH | ~0.15 ETH |
| Batch of 50 | ~6M | ~0.3 ETH | ~0.6 ETH |

### Monthly Cost Examples

**Scenario 1: Small Business (10 subscriptions)**
- Payments per month: 10
- Gas per payment: 200k
- Total gas: 2M
- Cost @ 50 Gwei: ~0.1 ETH (~$300)

**Scenario 2: Medium Business (100 subscriptions)**
- Payments per month: 100
- Batch size: 10
- Batches: 10
- Total gas: 15M
- Cost @ 50 Gwei: ~0.75 ETH (~$2,250)

**Scenario 3: Large Platform (1000 subscriptions)**
- Payments per month: 1000
- Batch size: 50
- Batches: 20
- Total gas: 120M
- Cost @ 50 Gwei: ~6 ETH (~$18,000)

### Cost Optimization Tips

1. **Use L2 Networks**
   - Polygon: 1/100th the cost
   - Arbitrum/Optimism: 1/10th the cost

2. **Optimize Batch Sizes**
   - Larger batches = more efficient
   - Balance with gas limits

3. **Adjust Check Intervals**
   - Monthly subscriptions: 1 hour intervals
   - Weekly subscriptions: 15 min intervals

4. **Set Gas Price Limits**
   - Avoid processing during high gas periods
   - Queue up for later processing

5. **Consider Time Ranges**
   - Process during low-gas hours
   - Use time-based conditions in resolver

---

## Next Steps

After completing this integration:

1. ✅ Read [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing strategies
2. ✅ Review [README.md](../README.md) for architecture overview
3. ✅ Set up monitoring and alerts
4. ✅ Plan for scaling and optimization
5. ✅ Document your deployment for your team

---

## Additional Resources

- [Gelato Network Documentation](https://docs.gelato.network/)
- [Gelato Automate SDK](https://github.com/gelatodigital/automate-sdk)
- [Hardhat Documentation](https://hardhat.org/docs)
- [PYUSD Documentation](https://paxos.com/pyusd/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

**Questions or Issues?**

Open an issue on GitHub or contact the team. Happy automating! 🚀

