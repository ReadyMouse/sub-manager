# 🤖 Gelato Automation Setup Guide

**Quick guide to get your StableRent subscription payments automated with Gelato**

---

## ✅ Your Deployed Contracts (Sepolia)

- **Main Contract**: `0xd91844e669a6138dc41fe1aEb0091822CC12f4d1`
- **Gelato Resolver**: `0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36`
- **Gelato Executor**: `0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68`

**View on Etherscan:**
- [Resolver](https://sepolia.etherscan.io/address/0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36)
- [Executor](https://sepolia.etherscan.io/address/0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68)

---

## 🚀 Step-by-Step Setup (10 minutes)

### Step 1: Connect to Gelato (2 min)

1. Go to: **https://app.gelato.network/**
2. Click **"Connect Wallet"**
3. Connect with MetaMask (use the same wallet that deployed the contracts)
4. Switch to **Sepolia** network in the top-right

### Step 2: Fund Your Gas Tank (2 min)

**What is Gas Tank?** (formerly 1Balance) It's a prepaid gas tank that Gelato uses to pay for your automated transactions.

1. Click **"Paymaster & Bundler"** in the left sidebar
2. Click **"Gas Tank"** tab
3. Make sure **Sepolia** is selected
4. Click **"Deposit"**
5. Deposit either:
   - **0.01 ETH** (if available), OR
   - **10-20 USDC** (equivalent gas value)
6. Wait for transaction confirmation

**Note:** Gelato now supports multiple payment tokens (ETH, USDC, etc.) - choose what's available on Sepolia.

### Step 3: Create the Task (5 min)

1. Click **"Tasks"** in the left sidebar
2. Click **"Create Task"** button

#### **Target Contract**
- **Contract Address**: `0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68`
- **Network**: Sepolia
- **ABI**: Let it auto-detect (or paste from `artifacts/contracts/gelato/SubscriptionExecutor.sol/SubscriptionExecutor.json`)
- **Function to Call**: Select `processPayments`

#### **Resolver (Checker)**
- **Resolver Type**: Choose "Custom Resolver"
- **Resolver Address**: `0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36`
- **Resolver Function**: Select `checker`
- The checker function returns `(bool canExec, bytes execPayload)`

#### **Task Settings**
- **Task Name**: `StableRent - Sepolia`
- **Check Interval**: `5 minutes` (for testing)
- **Gas Limit**: `5000000` (5M gas)
- **Max Gas Price**: Leave default or set to `100 Gwei`

#### **Payment Settings**
- **Payment Method**: Gas Tank ✅ (should show your funded balance)
- Verify you have funds showing

3. Click **"Create Task"**
4. Approve the transaction in MetaMask
5. Wait for confirmation ✅

### Step 4: Verify Task is Active (1 min)

1. You should see your task in the dashboard
2. Status should show: **Active ✅**
3. Note your **Task ID** (save it)
4. Initial executions will show 0 (normal - waiting for payments to be due)

---

## 🧪 Testing Your Setup

### Create a Test Subscription

You need at least one subscription with a payment due to test the automation:

```bash
# Option 1: Use the frontend
# Go to: https://stablerent.vercel.app/
# 1. Connect wallet
# 2. Get test PYUSD from faucet
# 3. Create a subscription with SHORT interval (5 minutes for testing)
# 4. Wait 5+ minutes
# 5. Check Gelato dashboard for execution

# Option 2: Use Hardhat console
npx hardhat console --network sepolia
```

In console:
```javascript
// Load contracts
const deployments = require('./deployments/sepolia.json')
const resolver = await ethers.getContractAt("SubscriptionResolver", deployments.GelatoResolver)

// Check if any payments are due
await resolver.getPaymentsDueCount()
// Should return: 0n (if no subscriptions or none due yet)

// Check what the resolver returns
const [canExec, payload] = await resolver.checker()
console.log("Can Execute:", canExec)  // false = nothing to do yet
console.log("Payload:", payload)
```

### Watch for Execution

Once you have a subscription that's due:

1. **Gelato Dashboard**: You'll see execution count increase
2. **Etherscan**: Check the [Executor contract](https://sepolia.etherscan.io/address/0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68#events) for `BatchProcessed` events
3. **Console**: Check stats:

```javascript
const executor = await ethers.getContractAt("SubscriptionExecutor", deployments.GelatoExecutor)
await executor.getStats()
// Returns: [totalProcessed, totalBatches, totalFailures]
```

---

## 📊 Monitoring Your Task

### Daily Checks

✅ **Check Gas Tank**: https://app.gelato.network/ → Paymaster & Bundler → Gas Tank
- Verify you have sufficient balance remaining (> $5 worth)

✅ **Check Task Status**: https://app.gelato.network/tasks
- Status: Active ✅
- Recent executions visible
- Success rate > 90%

✅ **Check Contract Stats**:
```bash
npx hardhat console --network sepolia
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68")
> await executor.getStats()
```

### View Events on Etherscan

**Batch Processed Events**:
https://sepolia.etherscan.io/address/0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68#events

Look for:
- `BatchProcessed` - Shows how many payments were processed
- `PaymentProcessed` - Shows individual payment results
- `GelatoExecutorUpdated` - If you change settings

---

## 🔧 Troubleshooting

### Task Not Executing?

**Check #1: Are any payments actually due?**
```javascript
const resolver = await ethers.getContractAt("SubscriptionResolver", "0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36")
await resolver.getPaymentsDueCount()
// Must be > 0 for Gelato to execute
```

**Check #2: Is Gas Tank funded?**
- Go to: https://app.gelato.network/ → Paymaster & Bundler → Gas Tank
- Must have > 0 balance on Sepolia (ETH or USDC)

**Check #3: Is task active?**
- Go to: https://app.gelato.network/tasks
- Should show "Active" status

### Payments Failing?

Check the failure reasons:
```javascript
const executor = await ethers.getContractAt("SubscriptionExecutor", "0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68")

// Get recent events
const filter = executor.filters.PaymentProcessed()
const events = await executor.queryFilter(filter, -1000)

// Show failures
events.filter(e => !e.args.success).forEach(e => {
  console.log(`Subscription ${e.args.subscriptionId}: ${e.args.reason}`)
})
```

Common reasons:
- "Insufficient PYUSD balance" → User needs more PYUSD
- "Insufficient allowance" → User needs to re-approve
- "Subscription not active" → User cancelled
- "Payment not due yet" → Timing issue

### Gas Tank Running Low?

**Set up alerts**:
1. In Gelato dashboard → Settings
2. Enable low balance notifications
3. Set threshold to $5-10 equivalent

**Refill immediately**:
1. Go to Paymaster & Bundler → Gas Tank
2. Deposit more ETH or USDC
3. Task automatically resumes

---

## 💡 Tips for Production

1. **Start Small**: Test with 1-2 subscriptions for 24 hours
2. **Monitor Costs**: Check gas usage daily for first week
3. **Increase Gradually**: Add more subscriptions slowly
4. **Set Alerts**: Enable all Gelato notifications
5. **Keep Funded**: Maintain at least $20-30 worth in Gas Tank
6. **Adjust Intervals**: Once stable, increase check interval to 15 minutes (saves gas)

---

## 📚 Additional Resources

- **Gelato Docs**: https://docs.gelato.network/
- **Gelato Discord**: https://discord.gg/gelato
- **Your Contracts**: See `deployments/sepolia.json`
- **Full Guide**: See `gelato-automation/docs/STEP_BY_STEP_GUIDE.md`

---

## ✅ Success Checklist

- [ ] Connected wallet to Gelato app
- [ ] Funded Gas Tank with 0.01 ETH or 10-20 USDC
- [ ] Created task with correct addresses
- [ ] Task shows as "Active"
- [ ] Created test subscription (5-min interval)
- [ ] Waited 5+ minutes
- [ ] Saw execution in Gelato dashboard
- [ ] Verified on Etherscan
- [ ] Checked stats with `getStats()`

Once all checked ✅ - **Your automation is working!** 🎉

---

## 🆘 Need Help?

**Can't figure something out?**

1. Check Gelato Discord: https://discord.gg/gelato
2. Review full docs: `gelato-automation/docs/`
3. Check contract on Etherscan for events
4. Try manual execution to debug:
   ```javascript
   // As contract owner
   await executor.processSinglePayment(subscriptionId)
   ```

---

**Happy Automating!** 🚀

