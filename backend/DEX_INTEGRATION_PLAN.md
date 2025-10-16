# DEX Integration Plan - Multi-Token Payments

## Overview

Future feature: Allow senders to pay with **any ERC-20 token** (ETH, USDC, DAI, etc.), automatically swap to PYUSD via DEX, and send PYUSD to recipient.

**Status:** Schema prepared, not yet implemented

## Current Flow (PYUSD Only)

```
┌─────────────────────────────────────────────────────────────────┐
│  Current: Direct PYUSD Payment                                  │
└─────────────────────────────────────────────────────────────────┘

Sender Wallet (PYUSD)
      │
      ▼ approve PYUSD spending
Smart Contract
      │
      ▼ transferFrom(sender, recipient, amount)
Recipient Wallet (PYUSD)

✅ Simple, direct, low gas
❌ Sender must have PYUSD
```

## Future Flow (Any Token → PYUSD)

```
┌─────────────────────────────────────────────────────────────────┐
│  Future: Auto-Swap via DEX                                      │
└─────────────────────────────────────────────────────────────────┘

Sender Wallet (ETH, USDC, DAI, etc.)
      │
      ▼ approve [ANY_TOKEN] spending
Smart Contract
      │
      ├─► Pull sender token
      │
      ├─► Swap via DEX (Uniswap/1inch)
      │   [ANY_TOKEN] → PYUSD
      │
      └─► Send PYUSD to recipient
          
Recipient Wallet (PYUSD)

✅ Sender can pay with any token
✅ Recipient always gets PYUSD
❌ Higher gas costs
❌ Slippage risk
```

## Database Schema (Already Prepared!)

### Subscription Model

```prisma
model Subscription {
  // EXISTING: Token configuration
  senderCurrency        String   @default("PYUSD")    // What sender pays with
  recipientCurrency     String   @default("PYUSD")    // What recipient receives
  amount                String                        // Amount in recipient currency
  
  // NEW: DEX configuration (optional, defaults to false)
  enableAutoSwap        Boolean  @default(false)      // Enable multi-token payments
  maxSlippage           Float?                        // Max slippage tolerance (0.5 = 0.5%)
  preferredDex          String?                       // "uniswap", "1inch", etc.
}
```

**Key Fields:**
- `senderCurrency`: "ETH", "USDC", "DAI", "PYUSD", etc.
- `recipientCurrency`: Always "PYUSD" (for now)
- `enableAutoSwap`: Must be true to enable DEX swaps
- `maxSlippage`: Protects sender from bad trades

### Payment Model

```prisma
model Payment {
  // EXISTING: Recipient's view
  amount                String   // What recipient received (in PYUSD)
  
  // NEW: DEX swap tracking
  swapExecuted          Boolean  @default(false)
  senderTokenAmount     String?  // "500000000000000000" (0.5 ETH)
  senderToken           String?  // "ETH"
  recipientTokenAmount  String?  // "1000000000" (1000 PYUSD)
  recipientToken        String?  // "PYUSD"
  exchangeRate          String?  // "2000" (1 ETH = 2000 PYUSD)
  dexUsed               String?  // "uniswap-v3"
  swapTransactionHash   String?  // If swap was separate tx
  slippageActual        Float?   // Actual slippage (0.3%)
}
```

## Implementation Phases

### Phase 1: Schema ✅ (DONE)
- [x] Add DEX fields to Subscription
- [x] Add swap tracking to Payment
- [x] All fields optional (backward compatible)
- [x] Defaults to false (no breaking changes)

### Phase 2: Smart Contract (Future)
- [ ] Add DEX router integration
- [ ] Support Uniswap V3
- [ ] Support 1inch aggregator
- [ ] Add slippage protection
- [ ] Gas optimization

### Phase 3: Backend (Future)
- [ ] API to set DEX preferences
- [ ] Webhook handler for swap events
- [ ] Exchange rate tracking
- [ ] Slippage monitoring

### Phase 4: Frontend (Future)
- [ ] Token selector UI
- [ ] Real-time exchange rate display
- [ ] Slippage settings
- [ ] Gas estimation with swap

## Example Usage (Future)

### Creating Subscription with ETH Payment

```typescript
// Sender wants to pay with ETH, recipient receives PYUSD
const subscription = await contract.createSubscription({
  senderId: "user-123",
  recipientId: "landlord-456",
  amount: "1000000000",        // 1000 PYUSD (recipient amount)
  interval: 2592000,           // 30 days
  serviceName: "Rent",
  recipientAddress: "0xrecipient...",
  senderCurrency: "ETH",       // 🔥 Pay with ETH!
  recipientCurrency: "PYUSD",  // Recipient gets PYUSD
  enableAutoSwap: true,        // Enable DEX swap
  maxSlippage: 0.5,           // 0.5% max slippage
  preferredDex: "uniswap-v3"
});

// When payment processes:
// 1. Contract calculates: 1000 PYUSD ≈ 0.5 ETH (at current rate)
// 2. Pulls 0.5 ETH from sender
// 3. Swaps 0.5 ETH → 1000 PYUSD via Uniswap
// 4. Sends 1000 PYUSD to recipient
```

### Payment Record

```json
{
  "id": "tx-123",
  "subscriptionId": "sub-456",
  "amount": "1000000000",           // Recipient got 1000 PYUSD
  "swapExecuted": true,             // Swap was performed
  "senderTokenAmount": "500000000000000000",  // Sender paid 0.5 ETH
  "senderToken": "ETH",
  "recipientTokenAmount": "1000000000",       // Recipient got 1000 PYUSD
  "recipientToken": "PYUSD",
  "exchangeRate": "2000",           // 1 ETH = 2000 PYUSD
  "dexUsed": "uniswap-v3",
  "slippageActual": 0.3,            // 0.3% slippage
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Supported Tokens (Future)

### Priority Tokens
- **ETH** - Native Ethereum
- **USDC** - Circle stablecoin
- **USDT** - Tether stablecoin
- **DAI** - MakerDAO stablecoin
- **WETH** - Wrapped ETH

### Secondary Tokens
- **WBTC** - Wrapped Bitcoin
- **UNI** - Uniswap token
- **LINK** - Chainlink
- **MATIC** - Polygon (on Ethereum)

## Smart Contract Architecture (Future)

```solidity
contract StableRentWithDEX {
  // Existing PYUSD-only function
  function createSubscription(...) {
    // Direct PYUSD transfer
  }
  
  // NEW: Multi-token function
  function createSubscriptionWithSwap(
    address senderToken,
    uint256 recipientAmount,  // In PYUSD
    uint256 maxSlippage,
    address dexRouter
  ) {
    // 1. Get quote from DEX
    uint256 senderAmount = getQuote(senderToken, PYUSD, recipientAmount);
    
    // 2. Pull sender token
    IERC20(senderToken).transferFrom(msg.sender, address(this), senderAmount);
    
    // 3. Approve DEX
    IERC20(senderToken).approve(dexRouter, senderAmount);
    
    // 4. Execute swap
    IDEXRouter(dexRouter).swap(senderToken, PYUSD, senderAmount, recipientAmount, maxSlippage);
    
    // 5. Send PYUSD to recipient
    IERC20(PYUSD).transfer(recipient, recipientAmount);
  }
}
```

## DEX Integration Options

### Option 1: Uniswap V3 (Direct)
**Pros:**
- Most liquidity
- Well-tested
- Concentrated liquidity = better rates

**Cons:**
- Complex integration
- Gas intensive
- May not always have best price

### Option 2: 1inch Aggregator (Recommended)
**Pros:**
- Finds best price across all DEXs
- Simpler integration
- Built-in slippage protection
- Gas optimization

**Cons:**
- Extra dependency
- Slightly higher gas (but better execution)

### Option 3: 0x Protocol
**Pros:**
- Very gas efficient
- Professional-grade
- Good for large swaps

**Cons:**
- More complex API
- Requires off-chain quote

## Risk Mitigation

### 1. Slippage Protection
```solidity
require(actualAmount >= expectedAmount * (1 - maxSlippage), "Slippage too high");
```

### 2. Price Oracle
- Use Chainlink price feeds
- Verify DEX quote is reasonable
- Prevent sandwich attacks

### 3. Minimum Amounts
```solidity
require(recipientAmount >= MIN_PYUSD_AMOUNT, "Amount too small for swap");
```

### 4. Gas Limits
```solidity
require(gasleft() >= MIN_GAS_FOR_SWAP, "Insufficient gas for swap");
```

## User Experience

### For Senders
```
1. Select subscription amount: 1000 PYUSD
2. Choose payment token: ETH ▼
3. See estimate: ~0.5 ETH
4. Approve ETH spending
5. Create subscription
6. Payment auto-swaps each month
```

### For Recipients
```
- Always receive PYUSD (no complexity)
- No exchange rate risk
- Same experience as PYUSD-only
```

## Gas Cost Comparison

| Method | Gas Cost | Complexity |
|--------|----------|------------|
| Direct PYUSD | ~100k | Low |
| Uniswap V2 Swap | ~150k | Medium |
| Uniswap V3 Swap | ~180k | High |
| 1inch Swap | ~200k | Medium |

**Cost to sender:** ~$20-40 extra per swap (at 50 gwei gas)

## Alternative: Off-Chain Swap

Instead of smart contract swapping, could use:

```
1. Sender swaps ETH → PYUSD on Uniswap manually
2. Sender approves PYUSD
3. Contract processes as normal PYUSD payment

OR

1. Frontend auto-swaps before transaction
2. User approves once
3. Contract sees PYUSD payment
```

**Pros:** Simpler contract, lower gas
**Cons:** More user steps, worse UX

## Migration Path

### Current Users (PYUSD only)
- No changes required
- `enableAutoSwap = false` (default)
- Works exactly as before

### Future Users (Multi-token)
- Set `enableAutoSwap = true`
- Choose `senderCurrency`
- Set `maxSlippage`
- Approve sender token instead of PYUSD

## Testing Strategy

1. **Unit Tests**
   - Test swap calculations
   - Test slippage protection
   - Test failure scenarios

2. **Integration Tests**
   - Test with Uniswap fork
   - Test various tokens
   - Test edge cases (low liquidity)

3. **Mainnet Fork Tests**
   - Test with real DEX state
   - Test gas costs
   - Test actual slippage

4. **Testnet Deployment**
   - Deploy to Sepolia
   - Test with real tokens
   - Monitor for issues

## Monitoring & Analytics

Track via backend:
- Swap success rate
- Average slippage
- Gas costs
- Exchange rates over time
- Most popular sender tokens

## Documentation Needed

1. User guide: "How to pay with any token"
2. Integration guide for DEXs
3. Smart contract documentation
4. Security audit reports
5. Gas optimization guide

## Estimated Timeline

- **Phase 2 (Contract):** 4-6 weeks
- **Phase 3 (Backend):** 2-3 weeks
- **Phase 4 (Frontend):** 3-4 weeks
- **Testing & Audit:** 4-6 weeks

**Total:** 3-4 months for full implementation

## Current Status

✅ **Database schema prepared** - No implementation needed now
⏳ **Smart contract** - Not started
⏳ **Backend API** - Not started
⏳ **Frontend UI** - Not started

The schema is **ready to support this feature** when you decide to implement it!

## Questions to Answer Before Implementation

1. Which DEX to use? (Recommend: 1inch)
2. Which tokens to support initially? (Recommend: ETH, USDC, USDT)
3. Max slippage limits? (Recommend: 0.5-2%)
4. Minimum payment amounts? (To cover gas)
5. Who pays extra gas? (Sender or split?)
6. Fallback if swap fails? (Cancel or retry?)

## License

MIT

