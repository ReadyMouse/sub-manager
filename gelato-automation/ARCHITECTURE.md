# Gelato Automation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    StableRent + Gelato Automation                       │
│                         Complete System Architecture                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐         ┌──────────────┐        ┌──────────────┐  │
│   │   Renter     │         │   Landlord   │        │   Platform   │  │
│   │   (Sender)   │         │  (Recipient) │        │     Admin    │  │
│   └──────┬───────┘         └──────┬───────┘        └──────┬───────┘  │
│          │                        │                        │           │
│          │ Creates Subscription   │ Receives Payments      │ Monitors │
│          │ Approves PYUSD         │ No wallet needed       │          │
│          │                        │ (uses payment address) │          │
└──────────┼────────────────────────┼────────────────────────┼───────────┘
           │                        │                        │
           ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SMART CONTRACTS LAYER                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │          StableRentSubscription.sol (Core Contract)            │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ • createSubscription()     - Users create subscriptions       │   │
│  │ • processPayment()          - Processes single payment         │   │
│  │ • cancelSubscription()      - Users can cancel                 │   │
│  │ • getPaymentsDue()          - Returns due subscription IDs     │   │
│  │ • getSubscription()         - View subscription details        │   │
│  └────────────────┬───────────────────────────────┬───────────────┘   │
│                   │                               │                    │
│                   │ Reads                         │ Calls              │
│                   │                               │                    │
│  ┌────────────────▼───────────┐   ┌──────────────▼──────────────┐   │
│  │  SubscriptionResolver.sol  │   │  SubscriptionExecutor.sol    │   │
│  │  (Gelato Checker)          │   │  (Gelato Executor)           │   │
│  ├────────────────────────────┤   ├─────────────────────────────┤   │
│  │ • checker()                 │   │ • processPayments()          │   │
│  │   → Returns (bool, bytes)  │   │   → Batch processing         │   │
│  │ • getPaymentsDueCount()    │   │ • processSinglePayment()    │   │
│  │ • getPaymentsDueList()     │   │   → Manual processing        │   │
│  │                            │   │ • updateGelatoExecutor()    │   │
│  │ READ-ONLY (No gas)         │   │ • getStats()                 │   │
│  │ Called off-chain           │   │                             │   │
│  └────────────▲───────────────┘   │ STATE-CHANGING (Gas cost)    │   │
│               │                    │ Called on-chain              │   │
│               │                    └──────────────▲───────────────┘   │
│               │                                   │                    │
└───────────────┼───────────────────────────────────┼────────────────────┘
                │                                   │
                │ Monitors                          │ Triggers
                │                                   │
┌───────────────┼───────────────────────────────────┼────────────────────┐
│               │      GELATO NETWORK LAYER         │                    │
├───────────────┼───────────────────────────────────┼────────────────────┤
│               │                                   │                    │
│  ┌────────────┴─────────────┐    ┌──────────────┴────────────┐       │
│  │   Gelato Monitoring      │    │   Gelato Execution        │       │
│  │   (Off-chain Bots)       │    │   (On-chain Tx)           │       │
│  ├──────────────────────────┤    ├───────────────────────────┤       │
│  │ • Calls checker()        │    │ • Calls processPayments() │       │
│  │   every N minutes        │    │   when checker returns    │       │
│  │ • No cost (read-only)    │    │   true                    │       │
│  │ • Decentralized network  │    │ • Pays gas from 1Balance  │       │
│  │                          │    │ • Submits transaction     │       │
│  └──────────────────────────┘    └───────────────────────────┘       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Gelato 1Balance                            │   │
│  │   (Prepaid gas tank - User deposits ETH/MATIC)               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Events
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MONITORING LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │  Gelato Dashboard  │  │  On-Chain Events   │  │  Statistics    │  │
│  ├────────────────────┤  ├────────────────────┤  ├────────────────┤  │
│  │ • Task status      │  │ • BatchProcessed   │  │ • getStats()   │  │
│  │ • Execution logs   │  │ • PaymentProcessed │  │ • Success rate │  │
│  │ • Gas usage        │  │ • PaymentFailed    │  │ • Gas costs    │  │
│  │ • 1Balance level   │  │ • Cancelled        │  │ • Failures     │  │
│  └────────────────────┘  └────────────────────┘  └────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

```

---

## Component Details

### 1. StableRentSubscription.sol (Core)

**Role**: Central subscription management

**Key Functions**:
```solidity
function createSubscription(...) external returns (uint256 subscriptionId)
function processPayment(uint256 subscriptionId) external
function cancelSubscription(uint256 subscriptionId) external
function getPaymentsDue() external view returns (uint256[] memory)
```

**Storage**:
- Subscription data (amount, interval, next payment due, etc.)
- User mappings (address → subscription IDs)
- Payment history (via events)

**Already Exists**: ✅ No changes needed!

---

### 2. SubscriptionResolver.sol (New)

**Role**: Determines when work is needed

**Key Functions**:
```solidity
function checker() external view returns (bool canExec, bytes memory execPayload)
```

**Process**:
1. Gelato calls `checker()` off-chain (no gas)
2. Resolver calls `subscriptionContract.getPaymentsDue()`
3. If subscriptions due:
   - Returns `(true, encodedSubscriptionIds)`
4. Else:
   - Returns `(false, "No payments due")`

**Gas Cost**: Zero (off-chain call)

**Batch Management**:
- Respects `maxBatchSize` to prevent gas limit issues
- If 100 subscriptions due and maxBatchSize=50, returns first 50
- Next check will return remaining 50

---

### 3. SubscriptionExecutor.sol (New)

**Role**: Executes payment processing

**Key Functions**:
```solidity
function processPayments(uint256[] calldata subscriptionIds) 
    external 
    onlyGelatoOrOwner
    returns (uint256 successCount, uint256 failureCount)
```

**Process**:
1. Gelato calls `processPayments([1,2,3])` on-chain (costs gas)
2. For each subscription ID:
   - Calls `subscriptionContract.processPayment(id)`
   - If success: increment `successCount`
   - If failure: increment `failureCount`, emit event, continue
3. Updates statistics
4. Emits `BatchProcessed` event

**Access Control**:
- Only `gelatoExecutor` address can call
- Or contract `owner` (for manual/emergency processing)

**Error Handling**:
- Try/catch for each payment
- Failures don't stop batch processing
- Detailed error logging

**Gas Cost**: ~180k per successful payment

---

## Execution Flow

### Normal Flow (Automated)

```
Step 1: User Creates Subscription
├─► User approves PYUSD spending
├─► User calls createSubscription()
├─► Subscription stored on-chain
└─► nextPaymentDue = now + interval

Step 2: Time Passes
├─► block.timestamp increases
└─► nextPaymentDue is reached

Step 3: Gelato Checks (every 5 minutes)
├─► Gelato calls Resolver.checker()
├─► Resolver calls SubscriptionContract.getPaymentsDue()
├─► Returns: [1, 5, 12, ...] (subscription IDs due)
└─► Resolver returns: (true, encodedIDs)

Step 4: Gelato Executes
├─► Gelato calls Executor.processPayments([1, 5, 12])
├─► Executor loops through each ID
│   ├─► Calls SubscriptionContract.processPayment(1)
│   │   ├─► Transfers PYUSD: User → Recipient
│   │   ├─► Transfers Fee: User → Fee Collector
│   │   └─► Updates subscription state
│   ├─► Calls processPayment(5)
│   └─► Calls processPayment(12)
├─► Emits BatchProcessed event
└─► Updates stats

Step 5: Monitoring
├─► Events logged on-chain
├─► Gelato dashboard updated
├─► Statistics available via getStats()
└─► Next cycle begins (repeat from Step 2)
```

### Manual Flow (Emergency)

```
Emergency Situation (Gelato down, task paused, etc.)

Step 1: Owner Identifies Issue
├─► Gelato task not executing
├─► Or needs immediate processing
└─► Manual intervention required

Step 2: Owner Checks Due Subscriptions
├─► Call Resolver.getPaymentsDueList()
└─► Returns: [1, 5, 12, ...]

Step 3: Owner Processes Manually
├─► Option A: Process all
│   └─► executor.processPayments([1, 5, 12])
├─► Option B: Process one at a time
│   ├─► executor.processSinglePayment(1)
│   ├─► executor.processSinglePayment(5)
│   └─► executor.processSinglePayment(12)
└─► Same result as automated flow

Step 4: Resume Automation
├─► Fix Gelato task
├─► Fund 1Balance
└─► Resume normal automated flow
```

---

## Data Flow

### Subscription Creation

```
User Wallet
    ↓
 [approve PYUSD]
    ↓
StableRentSubscription
    ↓
 [create subscription]
    ↓
On-Chain Storage
    ↓
 [emit SubscriptionCreated event]
    ↓
Indexer (Envio) → Backend → Frontend Dashboard
```

### Payment Processing

```
Gelato Network
    ↓
SubscriptionResolver.checker()
    ↓
 [query getPaymentsDue()]
    ↓
 [return (true, [1,2,3])]
    ↓
Gelato Network
    ↓
 [trigger execution]
    ↓
SubscriptionExecutor.processPayments([1,2,3])
    ↓
For each ID:
    ↓
StableRentSubscription.processPayment(id)
    ↓
PYUSD Token Contract
    ↓
 [transferFrom(user, recipient, amount)]
    ↓
 [transferFrom(user, feeCollector, fee)]
    ↓
 [emit PaymentProcessed event]
    ↓
Indexer → Backend → Frontend Dashboard
```

---

## Security Model

### Access Control Matrix

| Function | Gelato | Owner | User | Public |
|----------|--------|-------|------|--------|
| **Resolver** |
| checker() | ✅ | ✅ | ✅ | ✅ (view only) |
| getPaymentsDueCount() | ✅ | ✅ | ✅ | ✅ (view only) |
| getPaymentsDueList() | ✅ | ✅ | ✅ | ✅ (view only) |
| **Executor** |
| processPayments() | ✅ | ✅ | ❌ | ❌ |
| processSinglePayment() | ❌ | ✅ | ❌ | ❌ |
| updateGelatoExecutor() | ❌ | ✅ | ❌ | ❌ |
| getStats() | ✅ | ✅ | ✅ | ✅ (view only) |

### Security Layers

1. **Contract Level**
   - ReentrancyGuard on executor
   - Ownable for admin functions
   - Access modifiers (onlyGelatoOrOwner)

2. **Execution Level**
   - Only authorized callers can execute
   - Try/catch prevents batch failure
   - Immutable subscription contract reference

3. **Financial Level**
   - User funds stay in wallet (not in contract)
   - PYUSD approval required
   - User can cancel anytime
   - Auto-cancel after 3 failures (core contract)

4. **Monitoring Level**
   - Complete event logging
   - Statistics tracking
   - Failure tracking
   - Gas usage monitoring

---

## Scalability

### Horizontal Scaling

**Current Capacity**:
- Single executor can handle 1000+ subscriptions
- Limited by gas per block (~30M on mainnet)
- Batch size of 50 = ~8.5M gas
- Can process ~150 payments per block
- ~7200 payments per hour (12 sec blocks)

**Bottlenecks**:
1. Gas limits (per transaction)
2. Gelato check interval (every N minutes)
3. 1Balance funding (needs periodic top-up)

**Solutions**:
1. **Multiple Executors**
   - Deploy multiple executor contracts
   - Each handles subset of subscriptions
   - Distribute load across executors

2. **L2 Networks**
   - Deploy to Polygon (cheaper gas)
   - Deploy to Arbitrum (faster blocks)
   - 10-100x more capacity

3. **Optimized Batch Sizes**
   - Tune maxBatchSize based on network
   - Larger batches on L2s
   - Smaller batches on mainnet

### Vertical Scaling

**Gas Optimization**:
- Current: ~180k per payment
- Target: <150k per payment
- Methods:
  - Optimize storage patterns
  - Reduce event data
  - Pack variables

**Check Interval Optimization**:
- High frequency: 1 min (more responsive, higher cost)
- Medium: 5-15 min (balanced)
- Low frequency: 30-60 min (cheaper, delayed processing)
- Dynamic: Adjust based on load

---

## Cost Model

### Gas Cost Breakdown

```
Single Payment Processing:
├─► Executor overhead: ~50k gas
├─► SubscriptionContract.processPayment(): ~150k gas
│   ├─► transferFrom(user, recipient): ~65k
│   ├─► transferFrom(user, feeCollector): ~52k
│   ├─► State updates: ~25k
│   └─► Event emissions: ~8k
└─► Total: ~200k gas

Batch Processing (10 payments):
├─► Executor overhead: ~50k gas (once)
├─► 10x processPayment(): 10 * 150k = 1.5M gas
├─► Loop overhead: ~5k per iteration = 50k
└─► Total: ~1.8M gas (~180k per payment)

Efficiency Gain: 10% savings on batch vs individual
```

### Monthly Cost Formula

```
Monthly Cost = (Subscriptions × Gas per Payment × Gas Price × ETH Price) / 1e9

Example (100 subscriptions, 50 Gwei, $3000 ETH):
= 100 × 180,000 × 50 × 3000 / 1,000,000,000
= $2,700 per month
```

### Cost Optimization Strategies

1. **Network Selection**
   - Mainnet: High cost, high security
   - L2s: Low cost, good security
   - Polygon: Lowest cost, 100x cheaper

2. **Batch Size**
   - Larger batches = more efficient
   - Optimal: 20-50 subscriptions
   - Diminishing returns >50

3. **Check Interval**
   - Longer intervals = less cost
   - But delayed processing
   - Balance user experience vs cost

4. **Gas Price Strategy**
   - Set max gas price limits
   - Process during low-gas periods
   - Monitor gas trends

---

## Failure Modes & Recovery

### Failure Scenarios

| Scenario | Impact | Detection | Recovery |
|----------|--------|-----------|----------|
| **Gelato Down** | No automatic processing | Task inactive | Manual processing by owner |
| **1Balance Empty** | Task paused | Gelato alert | Refill 1Balance |
| **High Gas Prices** | Processing stopped | Max gas price hit | Increase limit or wait |
| **User Insufficient Balance** | Payment fails | PaymentFailed event | Alert user |
| **User Revoked Allowance** | Payment fails | PaymentFailed event | User re-approves |
| **Contract Bug** | Various impacts | Test failures | Pause, fix, redeploy |
| **Network Congestion** | Delayed processing | Check intervals missed | Automatic catch-up |

### Monitoring & Alerts

**Critical Alerts** (immediate action):
- 1Balance < 0.1 ETH
- Task inactive for >1 hour
- Failure rate >20%
- No executions in 24 hours

**Warning Alerts** (review within 24h):
- 1Balance < 0.5 ETH
- Failure rate >5%
- Gas costs >budget
- High gas prices

**Info Alerts** (review weekly):
- Statistics summary
- Cost analysis
- Performance metrics

---

## Upgrade Path

### Current (V1)

- Single resolver
- Single executor
- Fixed batch size
- Manual 1Balance management

### Future (V2+)

**Potential Enhancements**:

1. **Dynamic Batch Sizing**
   - Adjust based on gas prices
   - Larger batches when gas is low
   - Smaller batches when gas is high

2. **Priority Queue**
   - Process high-value subscriptions first
   - User-paid priority fees
   - Time-critical subscriptions

3. **Multi-Network**
   - Deploy to multiple L2s
   - Unified monitoring dashboard
   - Cross-chain subscription support

4. **Self-Funding**
   - Collect processor fees
   - Auto-refill 1Balance from fees
   - Sustainable operation

5. **Advanced Monitoring**
   - AI-based anomaly detection
   - Predictive cost modeling
   - Automatic optimization

---

## Conclusion

The Gelato automation system provides:

✅ **Decentralized** - No centralized server  
✅ **Reliable** - Battle-tested Gelato Network  
✅ **Scalable** - Handles 1000+ subscriptions  
✅ **Efficient** - Optimized gas usage  
✅ **Monitored** - Complete observability  
✅ **Recoverable** - Manual fallback available  
✅ **Modular** - Can be extracted/reused  

It's production-ready for deployment! 🚀

---

*For implementation details, see the other documentation files.*

