# Gelato Automation Module

> **Automated Payment Processing for StableRent Subscription System**

This module provides decentralized, autonomous payment processing for the StableRent subscription platform using [Gelato Network](https://www.gelato.network/). Payments are automatically processed when due, without manual intervention.

---

## 🎯 Overview

### What This Module Does

Automatically monitors and processes subscription payments:
- **Checks** which subscriptions are due for payment
- **Processes** payments in efficient batches
- **Handles** failures gracefully
- **Scales** from 1 to 1000+ subscriptions
- **Operates** 24/7 without human intervention

### How It Works

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Gelato     │───→│   Resolver   │───→│  Executor    │
│   Network    │    │  (Checker)   │    │ (Processor)  │
└──────────────┘    └──────────────┘    └──────────────┘
      ↓                     ↓                    ↓
   Monitors            Identifies           Processes
  Every N min         Due Payments          Payments
```

1. **Gelato Network** periodically calls the **Resolver**
2. **Resolver** checks which subscriptions are due
3. If any are due, **Gelato** triggers the **Executor**
4. **Executor** processes all due payments in batches
5. Users and recipients are notified via events

---

## 📁 Module Structure

```
gelato-automation/
├── contracts/
│   ├── SubscriptionResolver.sol    # Checks for due subscriptions
│   └── SubscriptionExecutor.sol    # Processes payments in batches
├── scripts/
│   ├── deploy-automation.ts        # Deploy resolver + executor
│   └── create-gelato-task.ts       # Generate Gelato task config
├── test/
│   └── gelato-automation.test.ts   # Comprehensive test suite
├── docs/
│   ├── INTEGRATION_GUIDE.md        # Step-by-step integration
│   └── TESTING_GUIDE.md            # Testing strategies
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Hardhat 3.0+
- Deployed StableRent subscription contract
- Alchemy/Infura API key
- ETH/MATIC for gas (deposited to Gelato 1Balance)

### Installation

This module is part of the StableRent monorepo. No separate installation needed.

```bash
# From project root
cd /Users/mouse/src/sub-manager

# Install dependencies (if not already done)
npm install
```

### Deploy Automation

```bash
# Deploy to Sepolia testnet
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia

# Deploy to mainnet
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network mainnet
```

### Create Gelato Task

```bash
# Generate task configuration
npx hardhat run gelato-automation/scripts/create-gelato-task.ts --network sepolia

# Follow the output instructions to create task via:
# - Gelato Dashboard (recommended): https://app.gelato.network/
# - Or Gelato SDK (programmatic)
```

### Fund Gelato

1. Go to: https://app.gelato.network/balance
2. Deposit ETH/MATIC to 1Balance
3. Recommended: 0.1 ETH for testing, 1+ ETH for production

### Monitor

```bash
# View execution stats
npx hardhat console --network sepolia
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> await executor.getStats()
[ 150n, 45n, 3n ]  // 150 processed, 45 batches, 3 failures

# Monitor in real-time
# View task in Gelato dashboard: https://app.gelato.network/tasks
```

---

## 📚 Documentation

### Complete Guides

- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Full deployment walkthrough
- **[Testing Guide](./docs/TESTING_GUIDE.md)** - Comprehensive testing strategies

### Quick Links

- [Architecture](#architecture)
- [Contract Reference](#contract-reference)
- [Gas Costs](#gas-costs)
- [Security](#security)
- [FAQ](#faq)

---

## 🏗️ Architecture

### Contracts

#### 1. SubscriptionResolver.sol
**Purpose**: Determines if work is needed (read-only)

**Key Functions**:
```solidity
function checker() external view returns (bool canExec, bytes memory execPayload)
```
- Called off-chain by Gelato Network
- Returns `true` if subscriptions are due
- Returns encoded subscription IDs to process

**Gas**: Free (off-chain call)

#### 2. SubscriptionExecutor.sol
**Purpose**: Executes payment processing (state-changing)

**Key Functions**:
```solidity
function processPayments(uint256[] calldata subscriptionIds) external returns (uint256 successCount, uint256 failureCount)
```
- Called on-chain by Gelato Network
- Processes payments in batches
- Continues on individual failures
- Emits detailed events

**Gas**: ~180k per payment (optimized)

### Data Flow

```
User creates subscription
    ↓
User approves PYUSD spending (one-time)
    ↓
Subscription stored on-chain
    ↓
Time passes... payment becomes due
    ↓
Gelato calls Resolver.checker()
    ↓
Resolver queries SubscriptionContract.getPaymentsDue()
    ↓
Resolver returns (true, [subscriptionIds])
    ↓
Gelato triggers Executor.processPayments([subscriptionIds])
    ↓
Executor calls SubscriptionContract.processPayment() for each
    ↓
PYUSD transferred: User → Recipient
    ↓
Events emitted → Users notified
    ↓
Next cycle begins...
```

---

## 📖 Contract Reference

### SubscriptionResolver

**Constructor Parameters:**
```solidity
constructor(
    address _subscriptionContract,  // Main subscription contract address
    uint256 _maxBatchSize            // Max subscriptions per batch (e.g., 50)
)
```

**View Functions:**
```solidity
// Gelato checker (main entry point)
function checker() external view returns (bool canExec, bytes memory execPayload)

// Helper: Get count of due subscriptions
function getPaymentsDueCount() external view returns (uint256)

// Helper: Get list of due subscription IDs
function getPaymentsDueList() external view returns (uint256[] memory)
```

### SubscriptionExecutor

**Constructor Parameters:**
```solidity
constructor(
    address initialOwner,            // Contract owner
    address _subscriptionContract,   // Main subscription contract address
    address _gelatoExecutor          // Gelato Network executor address
)
```

**Core Functions:**
```solidity
// Process multiple payments (called by Gelato)
function processPayments(uint256[] calldata subscriptionIds) 
    external 
    returns (uint256 successCount, uint256 failureCount)

// Process single payment (owner only, for emergencies)
function processSinglePayment(uint256 subscriptionId) external
```

**Admin Functions:**
```solidity
// Update Gelato executor address
function updateGelatoExecutor(address _gelatoExecutor) external

// View statistics
function getStats() external view 
    returns (uint256 processed, uint256 batches, uint256 failures)
```

**Events:**
```solidity
event BatchProcessed(
    uint256 batchId,
    uint256 successCount,
    uint256 failureCount,
    uint256 gasUsed,
    uint256 timestamp
)

event PaymentProcessed(
    uint256 indexed subscriptionId,
    uint256 indexed batchId,
    bool success,
    string reason
)

event GelatoExecutorUpdated(
    address indexed oldExecutor,
    address indexed newExecutor,
    uint256 timestamp
)
```

---

## ⛽ Gas Costs

### Cost Analysis

| Operation | Gas | Cost @ 50 Gwei | Cost @ 100 Gwei |
|-----------|-----|----------------|-----------------|
| Single payment | 200,000 | 0.01 ETH | 0.02 ETH |
| Batch of 10 | 1,800,000 | 0.09 ETH | 0.18 ETH |
| Batch of 50 | 8,500,000 | 0.425 ETH | 0.85 ETH |

### Monthly Cost Estimates

**10 Subscriptions:**
- Gas: ~2M per month
- Cost @ 50 Gwei: ~0.1 ETH (~$300)

**100 Subscriptions:**
- Gas: ~18M per month
- Cost @ 50 Gwei: ~0.9 ETH (~$2,700)

**1000 Subscriptions:**
- Gas: ~180M per month
- Cost @ 50 Gwei: ~9 ETH (~$27,000)

### Cost Optimization

1. **Use L2 Networks**: 10-100x cheaper
   - Polygon: ~$30/month for 100 subscriptions
   - Arbitrum: ~$300/month for 100 subscriptions

2. **Optimize Batch Sizes**: Larger batches = more efficient

3. **Adjust Check Intervals**: Less frequent checks = lower costs

4. **Set Gas Limits**: Avoid processing during high gas periods

---

## 🔒 Security

### Security Features

✅ **ReentrancyGuard**: Prevents reentrancy attacks  
✅ **Access Control**: Only Gelato or owner can execute  
✅ **Graceful Failures**: Individual failures don't stop batch  
✅ **Event Logging**: Complete audit trail  
✅ **Immutable References**: Core addresses cannot change  

### Access Control

```solidity
modifier onlyGelatoOrOwner() {
    require(
        msg.sender == gelatoExecutor || msg.sender == owner(),
        "Only Gelato or owner can execute"
    );
    _;
}
```

- **Gelato Executor**: Can process payments automatically
- **Owner**: Can process payments manually (emergency)
- **Anyone Else**: Cannot execute (reverts)

### Audit Status

⚠️ **Not yet audited**

Recommended for production:
- [ ] Smart contract audit
- [ ] Security review
- [ ] Bug bounty program

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# With gas reporting
REPORT_GAS=true npx hardhat test gelato-automation/test/gelato-automation.test.ts

# With coverage
npx hardhat coverage --testfiles gelato-automation/test/gelato-automation.test.ts
```

### Test Coverage

Target: **> 90%** coverage

Tests include:
- ✅ Resolver functionality
- ✅ Executor functionality
- ✅ Batch processing
- ✅ Error handling
- ✅ Access control
- ✅ Integration tests
- ✅ Gas optimization
- ✅ Edge cases

See [Testing Guide](./docs/TESTING_GUIDE.md) for comprehensive testing strategies.

---

## 📊 Monitoring

### Key Metrics

1. **Uptime**: Task active and executing
2. **Success Rate**: % of successful payments
3. **Gas Usage**: Track costs over time
4. **Processing Delay**: Time from due to processed
5. **1Balance Level**: Ensure sufficient funds

### Monitoring Tools

**Gelato Dashboard:**
- https://app.gelato.network/tasks
- View execution history
- Monitor gas costs
- Check task status

**On-Chain Events:**
```typescript
// Listen for events
executor.on("BatchProcessed", (batchId, successCount, failureCount, gasUsed) => {
  console.log(`Batch ${batchId}: ${successCount} success, ${failureCount} failures`);
});
```

**Statistics:**
```typescript
const [processed, batches, failures] = await executor.getStats();
console.log(`Total: ${processed} payments, ${batches} batches, ${failures} failures`);
```

---

## 🤔 FAQ

### Why use Gelato instead of a centralized server?

**Pros of Gelato:**
- ✅ Decentralized (no single point of failure)
- ✅ No server maintenance
- ✅ Battle-tested infrastructure
- ✅ Built-in monitoring
- ✅ Multi-chain support

**Cons:**
- ❌ Gas costs for execution
- ❌ Less control over timing
- ❌ Requires 1Balance funding

### Can I use my own server instead?

Yes! The contracts are designed to be modular:
- Keep the same `SubscriptionExecutor`
- Call `processPayments()` from your server
- Just update `gelatoExecutor` to your server's address

### What happens if Gelato goes down?

You can manually process payments:
```typescript
await executor.connect(owner).processSinglePayment(subscriptionId);
```

Or switch to a different executor entirely.

### How do I handle failed payments?

Failed payments are logged but don't stop batch processing:
```typescript
executor.on("PaymentProcessed", (subId, batchId, success, reason) => {
  if (!success) {
    console.log(`Payment ${subId} failed: ${reason}`);
    // Alert user, retry later, etc.
  }
});
```

The main subscription contract will auto-cancel after 3 consecutive failures.

### Can I customize batch sizes?

Yes, via the `maxBatchSize` constructor parameter:
```solidity
new SubscriptionResolver(subscriptionAddress, 50); // Process max 50 at once
```

Adjust based on:
- Gas limits
- Execution time
- Cost optimization

### What if I run out of 1Balance?

Gelato will pause your task. Refill immediately:
1. Go to https://app.gelato.network/balance
2. Deposit ETH/MATIC
3. Task automatically resumes

**Best Practice**: Set up low-balance alerts!

### Can I use this on multiple chains?

Yes! Deploy to each chain:
```bash
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network polygon
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network arbitrum
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network optimism
```

Create separate Gelato tasks for each chain.

---

## 🛠️ Development

### Local Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Deploy locally
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network localhost

# Test locally (simulate Gelato)
npx hardhat console --network localhost
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> await executor.processPayments([1, 2, 3])
```

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/gelato-improvements`
3. Make changes
4. Add tests
5. Run test suite: `npm test`
6. Commit: `git commit -am 'Add gelato improvements'`
7. Push: `git push origin feature/gelato-improvements`
8. Create Pull Request

---

## 📜 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

## 🔗 Resources

### Gelato Network
- [Documentation](https://docs.gelato.network/)
- [Dashboard](https://app.gelato.network/)
- [Discord](https://discord.gg/gelato)
- [GitHub](https://github.com/gelatodigital)

### StableRent
- [Main README](../README.md)
- [Architecture](../backend/ARCHITECTURE.md)
- [Local Development](../LOCAL_DEVELOPMENT.md)

### Tools
- [Hardhat](https://hardhat.org/)
- [OpenZeppelin](https://docs.openzeppelin.com/contracts/)
- [PYUSD](https://paxos.com/pyusd/)

---

## 📞 Support

- **GitHub Issues**: [Open an issue](https://github.com/your-repo/issues)
- **Discord**: [Join our server](#)
- **Email**: support@stablerent.io

---

**Built with ❤️ for the StableRent ecosystem**

*Automate your subscriptions. Set it and forget it.* 🚀

