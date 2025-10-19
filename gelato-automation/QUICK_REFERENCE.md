# Gelato Automation Quick Reference

> **Quick commands and info for daily operations**

---

## 🚀 Quick Start

```bash
# Deploy to testnet
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia

# Deploy to mainnet
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network mainnet

# Run tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Generate Gelato task config
npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network sepolia
```

---

## 📋 Essential Commands

### Check Status
```bash
# Open console
npx hardhat console --network sepolia

# Load contracts
const d = require('./deployments/sepolia.json')
const resolver = await ethers.getContractAt("SubscriptionResolver", d.GelatoResolver)
const executor = await ethers.getContractAt("SubscriptionExecutor", d.GelatoExecutor)

# Check due subscriptions
await resolver.getPaymentsDueCount()

# Check executor stats
await executor.getStats()
// Returns: [processed, batches, failures]
```

### Manual Processing
```bash
# Process single payment (emergency)
await executor.connect(owner).processSinglePayment(1)

# Process batch
const dueIds = await resolver.getPaymentsDueList()
await executor.connect(owner).processPayments(dueIds)
```

### Monitor Events
```bash
# Listen for BatchProcessed events
executor.on("BatchProcessed", (batchId, successCount, failureCount, gasUsed) => {
  console.log(`Batch ${batchId}: ${successCount} success, ${failureCount} failures`)
})

# Listen for PaymentProcessed events
executor.on("PaymentProcessed", (subId, batchId, success, reason) => {
  console.log(`Payment ${subId}: ${success ? 'Success' : 'Failed'} - ${reason}`)
})
```

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Gelato Dashboard | https://app.gelato.network/ |
| Gelato Docs | https://docs.gelato.network/ |
| 1Balance | https://app.gelato.network/balance |
| Etherscan (Mainnet) | https://etherscan.io/ |
| Sepolia Explorer | https://sepolia.etherscan.io/ |

---

## 📊 Contract Addresses

### Gelato Executors (Official)
| Network | Address |
|---------|---------|
| Mainnet | `0x3CACa7b48D0573D793d3b0279b5F0029180E83b6` |
| Sepolia | `0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0` |
| Polygon | `0x527a819db1eb0e34426297b03bae11F2f8B3A19E` |
| Arbitrum | `0x4775aF8FEf4809fE10bf05867d2b038a4b5B2146` |

### Your Deployed Contracts
Check: `deployments/[network].json`

---

## ⛽ Gas Cost Estimates

| Operation | Gas | @ 50 Gwei | @ 100 Gwei |
|-----------|-----|-----------|------------|
| 1 payment | 200k | 0.01 ETH | 0.02 ETH |
| 10 payments | 1.8M | 0.09 ETH | 0.18 ETH |
| 50 payments | 8.5M | 0.425 ETH | 0.85 ETH |

**Monthly Costs:**
- 10 subscriptions: ~$300 @ 50 Gwei
- 100 subscriptions: ~$2,700 @ 50 Gwei
- 1000 subscriptions: ~$27,000 @ 50 Gwei

**L2 Networks** (Polygon):
- 100x cheaper than mainnet
- 100 subscriptions: ~$27/month

---

## 🔧 Configuration

### Max Batch Size
Set in resolver deployment:
```typescript
new SubscriptionResolver(subscriptionAddress, 50) // Max 50 per batch
```

### Check Interval
Set in Gelato task:
- Testing: 1 minute
- Production: 5-15 minutes

### Gas Limits
Recommended per batch size:
- 1-10 payments: 2M gas
- 11-25 payments: 3M gas
- 26-50 payments: 5M gas

---

## 🚨 Troubleshooting

### Task Not Executing
1. Check `resolver.getPaymentsDueCount()` > 0
2. Check `resolver.checker()` returns `true`
3. Check Gelato task is active
4. Check 1Balance has funds

### High Failure Rate
1. Check `PaymentFailed` events for reasons
2. Common: "Insufficient balance" or "Insufficient allowance"
3. Alert affected users
4. Consider auto-notifications

### High Gas Costs
1. Increase batch size
2. Increase check interval
3. Lower max gas price
4. Consider L2 deployment

---

## 📈 Monitoring Checklist

### Daily
- [ ] Check 1Balance > 0.5 ETH
- [ ] Check task is active
- [ ] Check failure rate < 5%
- [ ] Review any errors

### Weekly
- [ ] Analyze gas costs
- [ ] Review execution logs
- [ ] Check user feedback
- [ ] Optimize settings if needed

### Monthly
- [ ] Cost analysis vs budget
- [ ] Performance review
- [ ] Security review
- [ ] Documentation updates

---

## 🆘 Emergency Contacts

- **Gelato Support**: support@gelato.network
- **Gelato Discord**: https://discord.gg/gelato
- **GitHub Issues**: [Your repo]/issues

---

## 📚 Documentation

- **[README](./README.md)** - Overview
- **[INTEGRATION_GUIDE](./docs/INTEGRATION_GUIDE.md)** - Full integration
- **[TESTING_GUIDE](./docs/TESTING_GUIDE.md)** - Testing strategies
- **[STEP_BY_STEP_GUIDE](./docs/STEP_BY_STEP_GUIDE.md)** - Complete walkthrough

---

## 🔑 Key Functions

### Resolver
```solidity
function checker() external view returns (bool canExec, bytes memory execPayload)
function getPaymentsDueCount() external view returns (uint256)
function getPaymentsDueList() external view returns (uint256[] memory)
```

### Executor
```solidity
function processPayments(uint256[] calldata subscriptionIds) external returns (uint256, uint256)
function processSinglePayment(uint256 subscriptionId) external
function updateGelatoExecutor(address _gelatoExecutor) external
function getStats() external view returns (uint256, uint256, uint256)
```

---

## 💡 Tips

1. **Start small** - Test with 1-2 subscriptions first
2. **Monitor closely** - Watch for 24 hours before scaling
3. **Set alerts** - Low balance, high failures, task inactive
4. **Document issues** - Track problems and solutions
5. **Regular reviews** - Weekly checks of costs and performance
6. **Keep 1Balance funded** - Never let it run dry
7. **Use L2s for scale** - Much cheaper for high volume

---

**Last Updated**: 2025-10-18

*For detailed information, see the full documentation guides.*

