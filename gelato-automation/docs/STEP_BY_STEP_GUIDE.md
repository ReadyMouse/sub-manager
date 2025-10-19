# Complete Step-by-Step Guide: Gelato Automation Integration, Testing & Documentation

> **From Zero to Automated Subscription Payments in One Guide**

This comprehensive guide walks you through every step of integrating, testing, and deploying Gelato automation for the StableRent subscription system.

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Understanding the System](#2-understanding-the-system)
3. [Local Development & Testing](#3-local-development--testing)
4. [Testnet Deployment](#4-testnet-deployment)
5. [Gelato Integration](#5-gelato-integration)
6. [Production Deployment](#6-production-deployment)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites & Setup

### 1.1 Required Tools

Install these before starting:

```bash
# Check Node.js version (need 18+)
node --version
# v18.17.0 or higher

# Check npm
npm --version
# 9.6.7 or higher

# Check Hardhat
npx hardhat --version
# 3.0.0 or higher
```

If missing, install:
```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Hardhat is installed with npm packages
```

### 1.2 Clone & Install

```bash
# Navigate to your project
cd /Users/mouse/src/sub-manager

# Install dependencies
npm install

# Verify installation
npx hardhat compile
```

### 1.3 Environment Setup

Create `.env` file:
```bash
# Copy example
cp .env.example .env

# Edit with your values
vim .env
```

Required variables:
```bash
# Ethereum Node (Alchemy or Infura)
ALCHEMY_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Deployer Private Key
PRIVATE_KEY=0x...

# Block Explorer (for verification)
ETHERSCAN_API_KEY=YOUR_KEY

# Gelato (optional, for SDK usage)
GELATO_API_KEY=YOUR_KEY
```

Get API keys:
- **Alchemy**: https://dashboard.alchemy.com/ (free)
- **Etherscan**: https://etherscan.io/apis (free)
- **Gelato**: https://app.gelato.network/ (optional)

### 1.4 Verify Setup

```bash
# Compile all contracts
npx hardhat compile

# Run a simple test
npx hardhat test test/1-setup-and-providers.test.ts

# Should see:
# ✓ All tests passing
```

---

## 2. Understanding the System

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                StableRent + Gelato Architecture             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐
│     Users       │ Creates subscriptions, approves PYUSD
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ StableRent      │ Core subscription logic
│ Subscription    │ - createSubscription()
│ Contract        │ - processPayment()
│                 │ - getPaymentsDue()
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Subscription    │───→│ Subscription    │───→│ Gelato Network  │
│ Resolver        │    │ Executor        │    │ (Off-chain)     │
│ (Checker)       │    │ (Processor)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ↑                     ↑                        │
         │                     │                        │
         └─────────────────────┴────────────────────────┘
                    Monitoring & Execution Loop
```

### 2.2 Component Roles

**1. StableRentSubscription.sol** (Already exists)
- Core subscription management
- Stores subscription data
- Processes payments via `processPayment()`
- Provides `getPaymentsDue()` view function

**2. SubscriptionResolver.sol** (New)
- Checks which subscriptions are due
- Called off-chain by Gelato (no gas cost)
- Returns list of subscriptions to process
- Implements `checker()` pattern

**3. SubscriptionExecutor.sol** (New)
- Processes payments in batches
- Called on-chain by Gelato (gas cost)
- Handles errors gracefully
- Tracks statistics and emits events

**4. Gelato Network** (External service)
- Decentralized automation platform
- Monitors resolver every N minutes
- Triggers executor when work is needed
- Charges for gas from 1Balance

### 2.3 Execution Flow

**Step-by-Step Process:**

1. **User Creates Subscription**
   ```
   User → Approve PYUSD → Create Subscription → Stored on-chain
   ```

2. **Time Passes**
   ```
   block.timestamp advances... subscription becomes due
   ```

3. **Gelato Checks** (every 5 minutes)
   ```
   Gelato → Resolver.checker() → Query getPaymentsDue()
   ```

4. **Work Detected**
   ```
   Resolver returns: (true, [subscriptionIds])
   ```

5. **Gelato Executes**
   ```
   Gelato → Executor.processPayments([1, 2, 3])
   ```

6. **Payments Processed**
   ```
   For each subscription:
     - Transfer PYUSD: User → Recipient
     - Transfer Fee: User → Fee Collector
     - Update subscription state
     - Emit events
   ```

7. **Monitoring**
   ```
   Events → Logs → Dashboard → Alerts
   ```

---

## 3. Local Development & Testing

### 3.1 Review Existing Contracts

First, understand the main subscription contract:

```bash
# View the main contract
cat contracts/StableRentSubscription.sol

# Key function to note:
# function getPaymentsDue() external view returns (uint256[] memory)
# This is what our resolver will call!
```

### 3.2 Review Gelato Contracts

```bash
# View resolver
cat gelato-automation/contracts/SubscriptionResolver.sol

# View executor
cat gelato-automation/contracts/SubscriptionExecutor.sol
```

**Key concepts:**
- Resolver is **view-only** (no state changes, no gas)
- Executor **modifies state** (processes payments, costs gas)
- Resolver returns encoded function call for executor

### 3.3 Run Local Tests

```bash
# Run all Gelato automation tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Expected output:
#   Gelato Automation
#     Resolver Tests
#       ✓ Should return false when no payments are due
#       ✓ Should detect due subscriptions
#       ✓ Should return correct exec payload
#       ✓ Should respect max batch size
#       ✓ Should return payments due count
#     Executor Tests
#       ✓ Should process single payment
#       ✓ Should emit BatchProcessed event
#       ✓ Should emit PaymentProcessed event
#       ✓ Should update statistics
#       ✓ Should only allow Gelato or owner to execute
#       ✓ Should allow owner to execute
#       ✓ Should handle payment failures gracefully
#       ✓ Should process batch of payments
#     Admin Functions
#       ✓ Should allow owner to update Gelato executor
#       ✓ Should not allow non-owner to update Gelato executor
#       ✓ Should allow owner to process single payment manually
#     Integration Tests
#       ✓ Should integrate resolver and executor correctly
#       ✓ Should handle multiple payment cycles
#     Gas Optimization Tests
#       ✓ Should measure gas for batch processing
#
#   18 passing (12.5s)
```

### 3.4 Run with Gas Reporting

```bash
# See gas costs for each operation
REPORT_GAS=true npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Look for:
# · SubscriptionExecutor  · processPayments  · 184739  · 200123  · 192431  ·
#                                            ↑         ↑         ↑
#                                          min       max       avg
```

### 3.5 Generate Coverage Report

```bash
# Run coverage analysis
npx hardhat coverage --testfiles gelato-automation/test/gelato-automation.test.ts

# View report
open coverage/index.html

# Target: >90% coverage for all contracts
```

### 3.6 Local Deployment Test

```bash
# Start local Hardhat node
npx hardhat node
# Keep this terminal open

# In new terminal, deploy
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network localhost

# Expected output:
# 🚀 Deploying Gelato Automation System...
# ✅ SubscriptionResolver deployed to: 0x...
# ✅ SubscriptionExecutor deployed to: 0x...
# 💾 Deployment addresses saved to: deployments/localhost.json
```

### 3.7 Manual Testing

```bash
# Open Hardhat console
npx hardhat console --network localhost

# Get contracts
const deployments = require('./deployments/localhost.json')
const resolver = await ethers.getContractAt("SubscriptionResolver", deployments.GelatoResolver)
const executor = await ethers.getContractAt("SubscriptionExecutor", deployments.GelatoExecutor)

# Check initial state
await resolver.getPaymentsDueCount()
// 0n

# Create a test subscription (if needed)
# ... see test files for examples ...

# Fast forward time
await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]) // 30 days
await ethers.provider.send("evm_mine")

# Check again
await resolver.getPaymentsDueCount()
// 1n (if subscription was created)

# Test resolver
const [canExec, payload] = await resolver.checker()
console.log("Can execute:", canExec)
console.log("Payload:", payload)

# Test executor (as owner)
const [owner] = await ethers.getSigners()
await executor.connect(owner).processSinglePayment(1)
// Payment processed!

# Check stats
await executor.getStats()
// [ 1n, 1n, 0n ] = 1 processed, 1 batch, 0 failures
```

---

## 4. Testnet Deployment

### 4.1 Get Testnet Funds

**Sepolia ETH** (for gas):
```bash
# Visit faucets:
# - https://sepoliafaucet.com/
# - https://www.alchemy.com/faucets/ethereum-sepolia
# - https://faucet.quicknode.com/ethereum/sepolia

# Verify balance
cast balance YOUR_ADDRESS --rpc-url $ALCHEMY_SEPOLIA_URL
# Should show > 0.1 ether
```

**Testnet PYUSD** (if available):
```bash
# Check if PYUSD is on Sepolia
# If not, use a mock ERC20 token for testing
```

### 4.2 Deploy Main Contract (if needed)

```bash
# Deploy StableRentSubscription first (if not already deployed)
npx hardhat run scripts/deploy.ts --network sepolia

# Verify deployment
cat deployments/sepolia.json
# Should show: { "StableRentSubscription": "0x..." }
```

### 4.3 Deploy Gelato Automation

```bash
# Deploy resolver + executor
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia

# Expected output:
# 🚀 Deploying Gelato Automation System...
#
# 📝 Deploying with account: 0xYourAddress
# 💰 Account balance: 0.5 ETH
#
# 🌐 Network: sepolia (Chain ID: 11155111)
#
# 📂 Loaded existing deployments from: deployments/sepolia.json
# ✅ Subscription contract found at: 0x...
#
# 🤖 Gelato Executor address: 0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0
# ⚙️  Configuration:
#    - Subscription Contract: 0x...
#    - Max Batch Size: 50
#    - Gelato Executor: 0x2A6C...
#    - Initial Owner: 0xYour...
#
# 📦 Deploying SubscriptionResolver...
# ✅ SubscriptionResolver deployed to: 0x...
#
# 📦 Deploying SubscriptionExecutor...
# ✅ SubscriptionExecutor deployed to: 0x...
#
# 💾 Deployment addresses saved to: deployments/sepolia.json
#
# ⏳ Waiting 30 seconds before verification...
#
# 🔍 Verifying contracts on block explorer...
# ✅ SubscriptionResolver verified
# ✅ SubscriptionExecutor verified
#
# ================================================================================
# 🎉 DEPLOYMENT COMPLETE!
# ================================================================================
#
# 📋 Contract Addresses:
#    Subscription Contract: 0x...
#    Gelato Resolver:       0x...
#    Gelato Executor:       0x...
#
# 🔧 Next Steps:
#    1. Create Gelato Task at https://app.gelato.network/
#    2. Fund Gelato 1Balance with ETH for gas
#    3. Test automation with: npm run test:gelato
#    4. Monitor execution in Gelato dashboard
```

### 4.4 Verify Contracts

```bash
# Check on Etherscan
# Visit: https://sepolia.etherscan.io/address/[RESOLVER_ADDRESS]
# Visit: https://sepolia.etherscan.io/address/[EXECUTOR_ADDRESS]

# Should show:
# ✅ Verified Contract
# ✅ Read/Write Contract tabs available
```

### 4.5 Create Test Subscription

Create a test subscription to verify the system works:

```bash
# Open console
npx hardhat console --network sepolia

# Load contracts
const deployments = require('./deployments/sepolia.json')
const subscription = await ethers.getContractAt("StableRentSubscription", deployments.StableRentSubscription)
const pyusd = await ethers.getContractAt("IERC20", "0x...") // PYUSD address

# Approve PYUSD
const amount = ethers.parseUnits("100", 6) // 100 PYUSD
const fee = ethers.parseUnits("1", 6) // 1 PYUSD
await pyusd.approve(deployments.StableRentSubscription, amount + fee)

# Create subscription (short interval for testing)
const tx = await subscription.createSubscription(
  1, // senderId
  2, // recipientId
  amount,
  5 * 60, // 5 minutes (for testing)
  "Test Subscription",
  0, // no end date
  0, // unlimited payments
  "0x...", // recipient address
  "PYUSD",
  "PYUSD",
  fee,
  "0x...", // fee collector
  "PYUSD",
  1
)

await tx.wait()
console.log("✅ Test subscription created")
```

### 4.6 Test Resolver

```bash
# Still in console
const resolver = await ethers.getContractAt("SubscriptionResolver", deployments.GelatoResolver)

# Check count (should be 0, just created)
await resolver.getPaymentsDueCount()
// 0n

# Wait 5+ minutes, then check again
// (or in new console session after 5 min)
await resolver.getPaymentsDueCount()
// 1n

// Get details
const [canExec, payload] = await resolver.checker()
console.log("Can execute:", canExec) // true
console.log("Payload:", payload)
```

### 4.7 Test Executor Manually

```bash
# Test executor before Gelato integration
const executor = await ethers.getContractAt("SubscriptionExecutor", deployments.GelatoExecutor)

# Process payment manually (as owner)
const tx = await executor.processSinglePayment(1n)
await tx.wait()
console.log("✅ Payment processed manually")

# Check stats
const [processed, batches, failures] = await executor.getStats()
console.log(`Processed: ${processed}, Batches: ${batches}, Failures: ${failures}`)
// Processed: 1, Batches: 1, Failures: 0

# Verify payment on Etherscan
// Check recipient balance increased
```

---

## 5. Gelato Integration

### 5.1 Generate Task Configuration

```bash
# Generate Gelato task config
npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network sepolia

# This outputs detailed instructions for creating the task
# Save the output for reference
```

### 5.2 Create Gelato Account

1. Go to: https://app.gelato.network/
2. Click "Connect Wallet"
3. Connect with MetaMask (same account that deployed contracts)
4. Select "Sepolia" network

### 5.3 Fund 1Balance

**What is 1Balance?**
A prepaid gas tank that Gelato uses to pay for transactions.

**How to fund:**
1. In Gelato app, go to "1Balance" tab
2. Select "Sepolia" network
3. Click "Deposit"
4. Send 0.01 ETH (enough for testing)
5. Wait for confirmation

### 5.4 Create Gelato Task

**Via Dashboard** (Recommended):

1. **Navigate to Tasks**
   - Click "Tasks" in left sidebar
   - Click "Create Task"

2. **Select Network**
   - Choose "Sepolia"

3. **Configure Target Contract**
   - **Contract Address**: [Your SubscriptionExecutor address]
   - **ABI**: Auto-detect or upload `SubscriptionExecutor.json`
   - **Function**: `processPayments`

4. **Configure Resolver**
   - **Resolver Type**: Custom Resolver
   - **Resolver Address**: [Your SubscriptionResolver address]
   - **Resolver ABI**: Auto-detect or upload `SubscriptionResolver.json`
   - **Resolver Function**: `checker`

5. **Task Settings**
   - **Task Name**: StableRent Subscription Processor - Sepolia
   - **Check Interval**: 1 minute (for testing)
   - **Gas Limit**: 5,000,000
   - **Max Gas Price**: 100 Gwei

6. **Payment**
   - **Method**: 1Balance
   - Verify you have funds

7. **Create**
   - Click "Create Task"
   - Sign transaction
   - Wait for confirmation

8. **Task Created!**
   - Note your Task ID
   - View in dashboard

### 5.5 Monitor Task Execution

**In Gelato Dashboard:**
1. Go to "Tasks" → "Your Task"
2. View:
   - Status: Active ✅
   - Last execution: (timestamp)
   - Execution count
   - Success rate
   - Gas used

**Via Console:**
```bash
# Open console
npx hardhat console --network sepolia

# Load executor
const deployments = require('./deployments/sepolia.json')
const executor = await ethers.getContractAt("SubscriptionExecutor", deployments.GelatoExecutor)

# Listen for events
executor.on("BatchProcessed", (batchId, successCount, failureCount, gasUsed, timestamp) => {
  console.log(`\n📦 Batch ${batchId} Processed:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failures: ${failureCount}`)
  console.log(`   ⛽ Gas: ${gasUsed}`)
  console.log(`   🕐 Time: ${new Date(Number(timestamp) * 1000).toISOString()}`)
})

executor.on("PaymentProcessed", (subId, batchId, success, reason) => {
  console.log(`\n💰 Payment for Subscription ${subId}:`)
  console.log(`   Status: ${success ? '✅ Success' : '❌ Failed'}`)
  console.log(`   Reason: ${reason}`)
})

console.log("👀 Monitoring events... (keep this running)")
// Keep console open to see real-time events
```

### 5.6 Verify Automated Execution

**Create Another Test Subscription:**
```bash
# Create subscription with 5-minute interval
# Wait 5+ minutes
# Check Gelato dashboard
# Should see automatic execution!
```

**Check Results:**
```bash
# View stats
const [processed, batches, failures] = await executor.getStats()
console.log(`Total processed: ${processed}`)
// Should increment automatically

# View on Etherscan
# https://sepolia.etherscan.io/address/[EXECUTOR_ADDRESS]#events
# Look for BatchProcessed events
```

---

## 6. Production Deployment

### 6.1 Pre-Deployment Checklist

- [ ] All tests passing (local + testnet)
- [ ] Testnet fully validated (24+ hours of successful execution)
- [ ] Security review completed
- [ ] Documentation finalized
- [ ] Monitoring tools set up
- [ ] Budget allocated (1+ ETH for gas)
- [ ] Team trained on operations
- [ ] Incident response plan documented

### 6.2 Deploy to Mainnet

```bash
# IMPORTANT: Double-check everything!

# Verify .env has mainnet config
cat .env | grep MAINNET

# Deploy (this costs real ETH!)
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network mainnet

# Save deployment addresses immediately
cp deployments/mainnet.json deployments/mainnet.json.backup
```

### 6.3 Verify Mainnet Deployment

```bash
# Check on Etherscan
# https://etherscan.io/address/[RESOLVER_ADDRESS]
# https://etherscan.io/address/[EXECUTOR_ADDRESS]

# Verify contracts are verified ✅
# Check deployment parameters are correct
```

### 6.4 Create Production Gelato Task

**Use Conservative Settings:**

1. **Network**: Ethereum Mainnet
2. **Check Interval**: 15 minutes (can adjust later)
3. **Gas Limit**: 3,000,000
4. **Max Gas Price**: 50 Gwei (adjust based on needs)
5. **1Balance**: Deposit 1 ETH minimum

### 6.5 Fund Production 1Balance

```bash
# Go to Gelato app → 1Balance → Mainnet
# Deposit 1-5 ETH depending on expected volume
# Set up auto-refill if available
```

### 6.6 Gradual Rollout

**Phase 1: Limited Beta** (Week 1)
- Allow 1-2 test users
- Monitor 24/7
- Collect feedback
- Fix any issues

**Phase 2: Soft Launch** (Week 2-3)
- Allow 10-20 users
- Continue monitoring
- Optimize settings
- Update documentation

**Phase 3: Public Launch** (Week 4+)
- Open to all users
- Scale monitoring
- Continuous optimization

---

## 7. Monitoring & Maintenance

### 7.1 Daily Checks

```bash
# Check 1Balance
# https://app.gelato.network/balance
# Verify > 0.5 ETH remaining

# Check task status
# https://app.gelato.network/tasks
# Verify: Active, recent executions, high success rate

# Check executor stats
npx hardhat console --network mainnet
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> await executor.getStats()
[ 1234n, 89n, 12n ]  // 1234 processed, 89 batches, 12 failures

# Calculate failure rate
> (12 / 1234 * 100).toFixed(2)
'0.97%'  // Should be <5%
```

### 7.2 Weekly Reviews

- [ ] Analyze gas costs vs. budget
- [ ] Review failure logs
- [ ] Check user feedback
- [ ] Update documentation with learnings
- [ ] Optimize settings if needed

### 7.3 Set Up Alerts

**Low 1Balance Alert:**
```javascript
// scripts/check-balance.js
const threshold = ethers.parseEther("0.5")
const balance = await getGelatoBalance()

if (balance < threshold) {
  sendAlert("⚠️ Gelato 1Balance low: " + ethers.formatEther(balance))
}
```

**High Failure Rate Alert:**
```javascript
const [processed, , failures] = await executor.getStats()
const failureRate = Number(failures) / Number(processed)

if (failureRate > 0.05) {
  sendAlert(`⚠️ High failure rate: ${(failureRate * 100).toFixed(2)}%`)
}
```

**Task Inactive Alert:**
```javascript
// Check last execution time
const lastBlock = await provider.getBlockNumber()
const events = await executor.queryFilter(
  executor.filters.BatchProcessed(),
  lastBlock - 1000,
  lastBlock
)

if (events.length === 0) {
  sendAlert("⚠️ No executions in last ~3 hours")
}
```

### 7.4 Dashboard Setup

Create a simple monitoring dashboard:

```typescript
// scripts/dashboard.ts
import { ethers } from "ethers"

async function dashboard() {
  const executor = await ethers.getContractAt("SubscriptionExecutor", EXECUTOR_ADDRESS)
  
  setInterval(async () => {
    const [processed, batches, failures] = await executor.getStats()
    const failureRate = (Number(failures) / Number(processed) * 100).toFixed(2)
    
    console.clear()
    console.log("╔════════════════════════════════════════╗")
    console.log("║   StableRent Gelato Dashboard          ║")
    console.log("╠════════════════════════════════════════╣")
    console.log(`║ Processed:    ${processed.toString().padStart(8)} payments    ║`)
    console.log(`║ Batches:      ${batches.toString().padStart(8)} batches     ║`)
    console.log(`║ Failures:     ${failures.toString().padStart(8)} (${failureRate}%)      ║`)
    console.log(`║ Success Rate: ${(100 - parseFloat(failureRate)).toFixed(2)}%              ║`)
    console.log("╚════════════════════════════════════════╝")
    console.log(`\nLast updated: ${new Date().toLocaleTimeString()}`)
  }, 30000) // Update every 30 seconds
}

dashboard()
```

Run it:
```bash
npx ts-node scripts/dashboard.ts
```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: Task Not Executing

**Symptoms:**
- Task shows "active" in Gelato dashboard
- No recent executions
- `getStats()` not increasing

**Diagnosis:**
```bash
# Check if subscriptions are due
npx hardhat console --network sepolia
> const resolver = await ethers.getContractAt("SubscriptionResolver", "0x...")
> await resolver.getPaymentsDueCount()
0n  // If 0, no subscriptions are due!

# Check resolver directly
> const [canExec, payload] = await resolver.checker()
> console.log(canExec)
false  // Gelato won't execute if false
```

**Solutions:**
1. Create a test subscription with short interval
2. Wait for subscription to become due
3. Verify `checker()` returns true
4. Check Gelato task is active

#### Issue: Payments Failing

**Symptoms:**
- Executions happening but failures increasing
- `PaymentFailed` events emitted

**Diagnosis:**
```bash
# Check failure events
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> const filter = executor.filters.PaymentProcessed(null, null, false)
> const events = await executor.queryFilter(filter, -1000)
> events.forEach(e => {
>   console.log(`Sub ${e.args.subscriptionId}: ${e.args.reason}`)
> })
```

**Common Reasons:**
- "Insufficient PYUSD balance" → User needs to top up
- "Insufficient PYUSD allowance" → User needs to re-approve
- "Payment not due yet" → Timing issue (shouldn't happen)
- "Subscription is not active" → User cancelled

**Solutions:**
1. Alert affected users
2. Provide clear instructions to resolve
3. Consider auto-retry logic
4. Implement low-balance warnings

#### Issue: High Gas Costs

**Symptoms:**
- 1Balance depleting quickly
- Gas costs higher than expected

**Diagnosis:**
```bash
# Check gas usage from recent batches
> const filter = executor.filters.BatchProcessed()
> const events = await executor.queryFilter(filter, -100)
> const avgGas = events.reduce((sum, e) => sum + Number(e.args.gasUsed), 0) / events.length
> console.log(`Average gas per batch: ${avgGas}`)
```

**Solutions:**
1. Increase batch size (more efficient)
2. Increase check interval (less frequent)
3. Set lower max gas price
4. Consider moving to L2 (Polygon, Arbitrum)

#### Issue: 1Balance Depleted

**Symptoms:**
- Task paused
- "Insufficient 1Balance" error

**Solutions:**
```bash
# Immediate: Refill 1Balance
# 1. Go to https://app.gelato.network/balance
# 2. Select network
# 3. Deposit ETH
# 4. Task automatically resumes

# Long-term: Set up auto-refill or alerts
```

### 8.2 Emergency Procedures

#### Manual Payment Processing

If Gelato is down or task is paused:

```bash
npx hardhat console --network mainnet
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> const resolver = await ethers.getContractAt("SubscriptionResolver", "0x...")

# Get due subscriptions
> const dueIds = await resolver.getPaymentsDueList()
> console.log(`${dueIds.length} subscriptions due`)

# Process manually as owner
> for (const id of dueIds) {
>   try {
>     await executor.processSinglePayment(id)
>     console.log(`✅ Processed ${id}`)
>   } catch (e) {
>     console.log(`❌ Failed ${id}: ${e.message}`)
>   }
> }
```

#### Pause Operations

If critical issue detected:

```bash
# Option 1: Pause Gelato task
# In Gelato dashboard → Pause Task

# Option 2: Update executor to disallow Gelato
> await executor.connect(owner).updateGelatoExecutor(ethers.ZeroAddress)
# Only owner can now execute

# Resume when ready
> await executor.connect(owner).updateGelatoExecutor(GELATO_EXECUTOR_ADDRESS)
```

### 8.3 Getting Help

**Resources:**
- Gelato Discord: https://discord.gg/gelato
- Gelato Docs: https://docs.gelato.network/
- GitHub Issues: [Your repo]/issues
- Team chat: [Your communication channel]

**When asking for help, include:**
1. Network (mainnet/sepolia)
2. Contract addresses
3. Task ID
4. Error messages
5. Transaction hashes
6. What you've already tried

---

## Next Steps

After completing this guide:

1. ✅ **Monitor for 30 days** before declaring production-ready
2. ✅ **Collect metrics** (gas costs, success rate, user feedback)
3. ✅ **Optimize settings** based on real data
4. ✅ **Document learnings** for your team
5. ✅ **Plan for scale** (L2 deployment, batch optimization)

---

## Appendix

### A. Useful Commands

```bash
# Deploy to network
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network [NETWORK]

# Run tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Generate task config
npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network [NETWORK]

# Open console
npx hardhat console --network [NETWORK]

# Check deployment
cat deployments/[NETWORK].json

# View events
npx hardhat console --network [NETWORK]
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> const events = await executor.queryFilter(executor.filters.BatchProcessed(), -1000)
> events.forEach(e => console.log(e.args))
```

### B. Contract Addresses

**Gelato Executor Addresses:**
- Mainnet: `0x3CACa7b48D0573D793d3b0279b5F0029180E83b6`
- Sepolia: `0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0`
- Polygon: `0x527a819db1eb0e34426297b03bae11F2f8B3A19E`
- Arbitrum: `0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146`

**PYUSD Addresses:**
- Mainnet: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`

### C. Gas Price Guidelines

**Mainnet:**
- Low: 20-30 Gwei (slow)
- Normal: 30-50 Gwei
- High: 50-100 Gwei (fast)
- Emergency: 100+ Gwei

**L2s:**
- Polygon: 30-200 Gwei (very cheap)
- Arbitrum: 0.1-1 Gwei (very cheap)
- Optimism: 0.001-0.01 Gwei (very cheap)

### D. Monthly Cost Calculator

```python
# Calculate monthly automation costs

# Variables
subscriptions = 100  # Number of active subscriptions
gas_per_payment = 200000
gas_price_gwei = 50
eth_price_usd = 3000

# Calculations
gas_per_month = subscriptions * gas_per_payment
eth_cost = (gas_per_month * gas_price_gwei) / 1e9
usd_cost = eth_cost * eth_price_usd

print(f"Monthly cost for {subscriptions} subscriptions:")
print(f"  Gas: {gas_per_month:,}")
print(f"  ETH: {eth_cost:.4f}")
print(f"  USD: ${usd_cost:.2f}")
```

---

**Congratulations!** 🎉

You've completed the full integration, testing, and deployment of Gelato automation for StableRent!

**Your subscriptions are now automated.** Users can truly "set it and forget it" for recurring payments. 🚀

---

*Built with ❤️ for the decentralized future of recurring payments.*

