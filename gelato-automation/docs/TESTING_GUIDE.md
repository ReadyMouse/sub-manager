# Gelato Automation Testing Guide

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Local Testing](#local-testing)
3. [Testnet Testing](#testnet-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)
6. [Production Readiness](#production-readiness)

---

## Testing Overview

This guide covers comprehensive testing strategies for the Gelato automation system. Follow these steps in order to ensure a reliable deployment.

### Testing Phases

```
Phase 1: Unit Tests (Local)
    ↓
Phase 2: Integration Tests (Local Fork)
    ↓
Phase 3: Testnet Deployment (Sepolia)
    ↓
Phase 4: Testnet Validation (Real Gelato)
    ↓
Phase 5: Production Deployment (Mainnet)
```

### Testing Environment Setup

```bash
# Install dependencies
npm install

# Configure Hardhat for testing
# Ensure hardhat.config.ts has forking enabled
networks: {
  hardhat: {
    forking: {
      url: process.env.ALCHEMY_MAINNET_URL,
      blockNumber: 18500000 // Pin for consistency
    }
  }
}

# Set up test environment
cp .env.example .env.test
```

---

## Local Testing

### Phase 1: Unit Tests

Run the comprehensive test suite:

```bash
# Run all Gelato automation tests
npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test gelato-automation/test/gelato-automation.test.ts

# Run with coverage
npx hardhat coverage --testfiles gelato-automation/test/gelato-automation.test.ts
```

### Expected Test Results

```
  Gelato Automation
    Resolver Tests
      ✓ Should return false when no payments are due (125ms)
      ✓ Should detect due subscriptions (456ms)
      ✓ Should return correct exec payload (389ms)
      ✓ Should respect max batch size (2145ms)
      ✓ Should return payments due count (278ms)
    
    Executor Tests
      ✓ Should process single payment (567ms)
      ✓ Should emit BatchProcessed event (234ms)
      ✓ Should emit PaymentProcessed event (345ms)
      ✓ Should update statistics (289ms)
      ✓ Should only allow Gelato or owner to execute (156ms)
      ✓ Should allow owner to execute (234ms)
      ✓ Should handle payment failures gracefully (678ms)
      ✓ Should process batch of payments (1234ms)
    
    Admin Functions
      ✓ Should allow owner to update Gelato executor (123ms)
      ✓ Should not allow non-owner to update Gelato executor (89ms)
      ✓ Should allow owner to process single payment manually (345ms)
    
    Integration Tests
      ✓ Should integrate resolver and executor correctly (789ms)
      ✓ Should handle multiple payment cycles (1567ms)
    
    Gas Optimization Tests
      ✓ Should measure gas for batch processing (2345ms)
      ⛽ Gas used for 10 payments: 1,847,392
      ⛽ Gas per payment: 184,739

  18 passing (12.5s)
```

### Writing Custom Tests

```typescript
// gelato-automation/test/custom.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Custom Test Scenarios", function () {
  it("Should handle your specific use case", async function () {
    // Deploy contracts
    const resolver = await deployResolver();
    const executor = await deployExecutor();
    
    // Create test subscriptions
    await createTestSubscription({
      amount: ethers.parseUnits("1000", 6),
      interval: 30 * 24 * 60 * 60,
    });
    
    // Fast forward time
    await time.increase(30 * 24 * 60 * 60);
    
    // Test resolver
    const [canExec, execPayload] = await resolver.checker();
    expect(canExec).to.be.true;
    
    // Test executor
    const decoded = decodePayload(execPayload);
    await executor.processPayments(decoded.subscriptionIds);
    
    // Verify results
    const [processed, batches, failures] = await executor.getStats();
    expect(processed).to.equal(1);
    expect(failures).to.equal(0);
  });
});
```

### Testing Checklist - Local

- [ ] All unit tests passing
- [ ] Gas costs within acceptable range
- [ ] Edge cases covered (no subscriptions, failed payments)
- [ ] Batch processing works correctly
- [ ] Access control enforced
- [ ] Events emitted correctly
- [ ] Statistics tracked accurately

---

## Testnet Testing

### Phase 2: Deploy to Sepolia

#### Step 1: Get Testnet Funds

```bash
# Get Sepolia ETH from faucets
# - https://sepoliafaucet.com/
# - https://www.alchemy.com/faucets/ethereum-sepolia

# Get testnet PYUSD (if available) or use mock token
```

#### Step 2: Deploy Contracts

```bash
# Deploy main subscription contract (if not already deployed)
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy Gelato automation
npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia
```

#### Step 3: Verify Deployment

```bash
# Check deployment addresses
cat deployments/sepolia.json

# Verify on Etherscan
# Visit: https://sepolia.etherscan.io/address/[YOUR_CONTRACT]

# Test resolver
npx hardhat console --network sepolia
> const resolver = await ethers.getContractAt("SubscriptionResolver", "0x...")
> await resolver.getPaymentsDueCount()
0n  // Should be 0 initially

# Test executor access
> const executor = await ethers.getContractAt("SubscriptionExecutor", "0x...")
> await executor.gelatoExecutor()
'0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0'  // Gelato's Sepolia executor
```

### Phase 3: Manual Testing on Testnet

#### Create Test Subscription

```typescript
// scripts/create-test-subscription.ts
import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  
  // Get PYUSD token
  const pyusd = await ethers.getContractAt("IERC20", PYUSD_ADDRESS);
  
  // Get subscription contract
  const subscription = await ethers.getContractAt(
    "StableRentSubscription",
    SUBSCRIPTION_ADDRESS
  );
  
  // Approve spending
  const amount = ethers.parseUnits("100", 6); // 100 PYUSD
  const fee = ethers.parseUnits("1", 6); // 1 PYUSD fee
  await pyusd.approve(SUBSCRIPTION_ADDRESS, amount + fee);
  
  // Create subscription
  const tx = await subscription.createSubscription(
    1, // senderId
    2, // recipientId
    amount,
    5 * 60, // 5 minutes for testing
    "Test Subscription",
    0,
    0,
    RECIPIENT_ADDRESS,
    "PYUSD",
    "PYUSD",
    fee,
    FEE_COLLECTOR,
    "PYUSD",
    1
  );
  
  await tx.wait();
  console.log("✅ Test subscription created");
}

main();
```

Run it:
```bash
npx hardhat run scripts/create-test-subscription.ts --network sepolia
```

#### Test Resolver Manually

```bash
npx hardhat console --network sepolia

# Wait 5+ minutes after creating subscription

# Check resolver
> const resolver = await ethers.getContractAt("SubscriptionResolver", RESOLVER_ADDRESS)
> const [canExec, payload] = await resolver.checker()
> canExec
true

# Decode payload
> const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256[]"], ethers.dataSlice(payload, 4))
> decoded[0]
[ 1n ]  // Subscription ID 1 is due
```

#### Test Executor Manually

```bash
# As owner, manually trigger executor
> const executor = await ethers.getContractAt("SubscriptionExecutor", EXECUTOR_ADDRESS)
> const tx = await executor.processSinglePayment(1n)
> await tx.wait()
✅ Payment processed

# Check stats
> await executor.getStats()
[ 1n, 1n, 0n ]  // 1 processed, 1 batch, 0 failures
```

### Phase 4: Create Gelato Task

Follow the [Integration Guide](./INTEGRATION_GUIDE.md#step-4-create-gelato-task) to create the Gelato task.

**Configuration for Testing:**
- Network: Sepolia
- Check Interval: 1 minute (for faster testing)
- Gas Limit: 2,000,000
- Deposit: 0.01 Sepolia ETH

### Phase 5: Monitor Gelato Execution

#### Wait for Automatic Execution

1. **Create subscription with short interval** (5 minutes)
2. **Wait for interval to pass**
3. **Check Gelato dashboard** for execution
4. **Verify payment on Etherscan**

#### Check Execution Logs

```bash
# View events on Etherscan
# https://sepolia.etherscan.io/address/[EXECUTOR_ADDRESS]#events

# Filter for BatchProcessed events
# Should see:
# - batchId: 0, 1, 2...
# - successCount: 1+
# - failureCount: 0
# - gasUsed: ~200k per payment
```

#### Monitor with Scripts

```typescript
// scripts/monitor-gelato.ts
import { ethers } from "hardhat";

async function monitor() {
  const executor = await ethers.getContractAt(
    "SubscriptionExecutor",
    EXECUTOR_ADDRESS
  );
  
  // Listen for events
  executor.on("BatchProcessed", (batchId, successCount, failureCount, gasUsed) => {
    console.log(`\n📦 Batch ${batchId} Processed:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failures: ${failureCount}`);
    console.log(`   ⛽ Gas: ${gasUsed}`);
  });
  
  executor.on("PaymentProcessed", (subId, batchId, success, reason) => {
    console.log(`\n💰 Payment ${subId}:`);
    console.log(`   Status: ${success ? '✅' : '❌'}`);
    console.log(`   Reason: ${reason}`);
  });
  
  console.log("👀 Monitoring Gelato execution...\n");
}

monitor();
```

Run monitor:
```bash
npx hardhat run scripts/monitor-gelato.ts --network sepolia
# Keep running to see real-time events
```

### Testing Checklist - Testnet

- [ ] Contracts deployed successfully
- [ ] Contracts verified on Etherscan
- [ ] Test subscription created
- [ ] Resolver correctly identifies due subscriptions
- [ ] Manual executor test successful
- [ ] Gelato task created
- [ ] Gelato 1Balance funded
- [ ] Automatic execution confirmed
- [ ] Payment received by recipient
- [ ] Events emitted correctly
- [ ] No errors in Gelato dashboard

---

## Integration Testing

### Full End-to-End Test

Test the complete flow from subscription creation to automated payment:

```typescript
// gelato-automation/test/e2e.test.ts
describe("End-to-End Integration", function () {
  it("Should automate payments from creation to execution", async function () {
    this.timeout(600000); // 10 minute timeout
    
    // 1. Setup
    const { subscription, resolver, executor, pyusd } = await deployAll();
    const [owner, renter, landlord] = await ethers.getSigners();
    
    // 2. Fund renter
    await fundWithPYUSD(renter.address, ethers.parseUnits("10000", 6));
    
    // 3. Create subscription
    const amount = ethers.parseUnits("1000", 6);
    const fee = ethers.parseUnits("10", 6);
    const interval = 60; // 1 minute for testing
    
    await pyusd.connect(renter).approve(
      await subscription.getAddress(),
      amount + fee
    );
    
    await subscription.connect(renter).createSubscription(
      1, 2, amount, interval, "Test", 0, 0,
      landlord.address, "PYUSD", "PYUSD",
      fee, owner.address, "PYUSD", 1
    );
    
    // 4. Verify resolver returns false (not due yet)
    let [canExec] = await resolver.checker();
    expect(canExec).to.be.false;
    
    // 5. Fast forward time
    await time.increase(interval);
    
    // 6. Verify resolver returns true (now due)
    [canExec] = await resolver.checker();
    expect(canExec).to.be.true;
    
    // 7. Execute payment (simulate Gelato)
    const [, execPayload] = await resolver.checker();
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256[]"],
      ethers.dataSlice(execPayload, 4)
    );
    
    await executor.connect(owner).processPayments(decoded[0]);
    
    // 8. Verify payment received
    const landlordBalance = await pyusd.balanceOf(landlord.address);
    expect(landlordBalance).to.equal(amount);
    
    // 9. Verify stats updated
    const [processed, batches, failures] = await executor.getStats();
    expect(processed).to.equal(1);
    expect(batches).to.equal(1);
    expect(failures).to.equal(0);
    
    // 10. Verify resolver now returns false (no more due)
    [canExec] = await resolver.checker();
    expect(canExec).to.be.false;
    
    console.log("✅ End-to-end test passed!");
  });
});
```

### Stress Testing

Test with many subscriptions:

```typescript
describe("Stress Test", function () {
  it("Should handle 100 subscriptions", async function () {
    this.timeout(300000); // 5 minutes
    
    const numSubs = 100;
    
    // Create 100 subscriptions
    for (let i = 0; i < numSubs; i++) {
      await createSubscription({
        senderId: i,
        amount: ethers.parseUnits("1000", 6),
      });
      
      if (i % 10 === 0) {
        console.log(`Created ${i} subscriptions...`);
      }
    }
    
    // Fast forward
    await time.increase(INTERVAL);
    
    // Check resolver
    const dueCount = await resolver.getPaymentsDueCount();
    expect(dueCount).to.equal(numSubs);
    
    // Process in batches
    const [canExec, execPayload] = await resolver.checker();
    expect(canExec).to.be.true;
    
    // Execute (will process MAX_BATCH_SIZE at a time)
    let remaining = numSubs;
    while (remaining > 0) {
      const [, payload] = await resolver.checker();
      const decoded = decodePayload(payload);
      
      await executor.processPayments(decoded.subscriptionIds);
      
      remaining -= decoded.subscriptionIds.length;
      console.log(`Processed batch, ${remaining} remaining`);
    }
    
    // Verify all processed
    const [processed] = await executor.getStats();
    expect(processed).to.equal(numSubs);
  });
});
```

---

## Performance Testing

### Gas Optimization

Measure gas costs for different batch sizes:

```typescript
describe("Gas Benchmarks", function () {
  const batchSizes = [1, 5, 10, 20, 50];
  
  for (const size of batchSizes) {
    it(`Should measure gas for batch size ${size}`, async function () {
      // Create subscriptions
      const subIds = await createMultipleSubscriptions(size);
      
      // Fast forward
      await time.increase(INTERVAL);
      
      // Process and measure gas
      const tx = await executor.processPayments(subIds);
      const receipt = await tx.wait();
      
      const gasUsed = receipt.gasUsed;
      const gasPerPayment = Number(gasUsed) / size;
      
      console.log(`Batch size ${size}:`);
      console.log(`  Total gas: ${gasUsed}`);
      console.log(`  Gas per payment: ${gasPerPayment}`);
      console.log(`  Cost @ 50 Gwei: ${ethers.formatEther(gasUsed * 50n)} ETH`);
      
      // Gas should be under thresholds
      expect(gasPerPayment).to.be.lessThan(250000);
    });
  }
});
```

### Expected Gas Results

| Batch Size | Total Gas | Gas/Payment | Cost @ 50 Gwei |
|------------|-----------|-------------|----------------|
| 1 | ~200k | 200k | 0.01 ETH |
| 5 | ~900k | 180k | 0.045 ETH |
| 10 | ~1.8M | 180k | 0.09 ETH |
| 20 | ~3.5M | 175k | 0.175 ETH |
| 50 | ~8.5M | 170k | 0.425 ETH |

**Optimization Notes:**
- Larger batches = better gas efficiency
- Diminishing returns after ~20 subscriptions
- Balance with gas limits and execution time

---

## Production Readiness

### Pre-Deployment Checklist

#### Code Quality
- [ ] All tests passing (100% success rate)
- [ ] Code coverage > 90%
- [ ] No compiler warnings
- [ ] Contracts optimized
- [ ] Security audit completed (if budget allows)

#### Documentation
- [ ] README complete
- [ ] Integration guide reviewed
- [ ] Testing guide reviewed
- [ ] API documentation complete
- [ ] Deployment runbook created

#### Security
- [ ] Access controls verified
- [ ] ReentrancyGuard in place
- [ ] Input validation comprehensive
- [ ] Event emissions correct
- [ ] Emergency pause mechanism (if needed)

#### Operations
- [ ] Monitoring dashboard set up
- [ ] Alerts configured
- [ ] Budget allocated for gas
- [ ] On-call rotation defined
- [ ] Incident response plan documented

### Deployment Process

1. **Final Testnet Validation**
   ```bash
   # Deploy to testnet one more time
   npx hardhat run gelato-automation/scripts/deploy-automation.ts --network sepolia
   
   # Run 24-hour test with real Gelato
   # Monitor for issues
   ```

2. **Mainnet Deployment**
   ```bash
   # Double-check configuration
   cat .env.production
   
   # Deploy to mainnet
   npx hardhat run gelato-automation/scripts/deploy-automation.ts --network mainnet
   
   # Verify immediately
   # Save all addresses securely
   ```

3. **Create Production Gelato Task**
   - Use conservative settings initially
   - Check interval: 15 minutes
   - Gas limit: 3,000,000
   - Max gas price: 50 Gwei
   - Fund 1Balance with 1+ ETH

4. **Gradual Rollout**
   - Start with 1-2 test subscriptions
   - Monitor for 24 hours
   - Gradually increase load
   - Monitor gas costs closely

5. **Go Live**
   - Open to all users
   - Monitor 24/7 for first week
   - Gather metrics and optimize
   - Collect user feedback

### Post-Deployment Monitoring

```typescript
// scripts/production-monitor.ts
import { ethers } from "ethers";
import { sendAlert } from "./alerts";

async function monitor() {
  const executor = await ethers.getContractAt(
    "SubscriptionExecutor",
    EXECUTOR_ADDRESS
  );
  
  // Check every minute
  setInterval(async () => {
    try {
      const [processed, batches, failures] = await executor.getStats();
      
      // Calculate failure rate
      const failureRate = Number(failures) / Number(processed);
      
      if (failureRate > 0.05) {
        // Alert if >5% failure rate
        sendAlert(`⚠️ High failure rate: ${(failureRate * 100).toFixed(2)}%`);
      }
      
      console.log(`📊 Stats: ${processed} processed, ${failures} failures`);
    } catch (error) {
      sendAlert(`❌ Monitoring error: ${error.message}`);
    }
  }, 60000);
}

monitor();
```

### Success Metrics

Track these KPIs:

1. **Uptime**: > 99.9%
2. **Success Rate**: > 95%
3. **Average Gas Cost**: < 0.005 ETH per payment
4. **Processing Delay**: < 15 minutes from due time
5. **User Satisfaction**: > 4.5/5

---

## Troubleshooting Tests

### Common Test Failures

#### 1. "Insufficient PYUSD balance"

**Cause**: Test account not funded properly

**Fix**:
```typescript
// Ensure proper funding
await fundWithPYUSD(renter.address, amount * 100n); // Fund for many payments
```

#### 2. "Payment not due yet"

**Cause**: Time not advanced enough

**Fix**:
```typescript
await time.increase(INTERVAL + 1); // Add extra second
```

#### 3. "Only Gelato or owner can execute"

**Cause**: Wrong signer used

**Fix**:
```typescript
await executor.connect(gelatoExecutor).processPayments([...]); // Use correct signer
```

#### 4. Test timeout

**Cause**: Test taking too long (Hardhat forking slow)

**Fix**:
```typescript
it("should...", async function () {
  this.timeout(60000); // Increase to 60 seconds
  // ...
});
```

---

## Continuous Testing

### CI/CD Integration

```yaml
# .github/workflows/test-gelato.yml
name: Gelato Automation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Gelato tests
        run: npx hardhat test gelato-automation/test/gelato-automation.test.ts
        env:
          ALCHEMY_MAINNET_URL: ${{ secrets.ALCHEMY_MAINNET_URL }}
      
      - name: Generate coverage
        run: npx hardhat coverage --testfiles gelato-automation/test/gelato-automation.test.ts
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Summary

Following this testing guide ensures:
- ✅ Robust local development
- ✅ Thorough testnet validation
- ✅ Confident production deployment
- ✅ Ongoing monitoring and optimization

**Remember**: Test thoroughly, deploy gradually, monitor continuously!

---

**Need Help?** Refer to [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) or open an issue on GitHub.

