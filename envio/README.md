# Envio Indexer Configuration

This directory contains the Envio indexer configuration for the StableRent subscription system.

## 📁 Configuration Files

### `config.yaml` (Production)
- **Network**: Sepolia testnet (chainId: 11155111)
- **Contract**: `0x278dD89e80B01772affcC8cAEa6e45fFF8Ae3339`
- **Usage**: Production/testnet deployment

### `config.local.yaml` (Local Testing)
- **Network**: Local Hardhat (chainId: 31337)
- **RPC**: `http://127.0.0.1:8545`
- **Contract**: Updated dynamically by back-propagation script
- **Usage**: Local development and testing with fake data

## 🚀 Usage

### For Production (Sepolia)
```bash
# Generate types
pnpm codegen

# Start indexer
pnpm dev
# or
pnpm start
```

### For Local Testing
```bash
# Generate types for local config
pnpm codegen:local

# Start indexer with local config
pnpm dev:local
# or
pnpm start:local
```

## 🔄 Switching Between Environments

The indexer uses different config files for different environments:

- **Production/Sepolia**: Uses `config.yaml` (default)
- **Local Hardhat**: Uses `config.local.yaml` (specify with `-c` flag)

You never need to edit `config.yaml` for local testing!

## 📋 Complete Local Testing Workflow

1. **Start Hardhat node** (Terminal 1):
   ```bash
   cd .. # to root directory
   npx hardhat node
   ```

2. **Generate fake data** (Terminal 2):
   ```bash
   cd .. # to root directory
   npx tsx scripts/setup-fake-data.ts
   ```
   
   This will:
   - Create fake subscriptions in your database
   - Deploy contract to local Hardhat
   - Update `config.local.yaml` with the contract address

3. **Start Envio indexer** (Terminal 3):
   ```bash
   # In envio directory
   pnpm dev:local
   ```

4. **Test the indexer** (Terminal 4):
   ```bash
   cd .. # to root directory
   npx tsx scripts/test-envio-indexer.ts
   ```

5. **Query GraphQL endpoint**:
   - Open: http://localhost:8080/graphql
   - Run queries to see indexed data

## 🔍 Updating Contract Address

### Automatic (Recommended)
The back-propagation script automatically updates `config.local.yaml` with the deployed contract address.

### Manual
If you need to manually update the contract address in `config.local.yaml`:

1. Find the contract address from `../deployments/localhost.json`
2. Update the `address` field in `config.local.yaml`:
   ```yaml
   contracts:
   - name: StableRentSubscription
     address:
     - 0xYourContractAddressHere
   ```
3. Regenerate types: `pnpm codegen:local`
4. Restart indexer: `pnpm dev:local`

## 🧪 Testing Queries

Once the indexer is running, you can test with these GraphQL queries:

### Get All Subscriptions
```graphql
query {
  stableRentSubscription_SubscriptionCreateds(first: 10) {
    subscriptionId
    serviceName
    amount
    senderAddress
    recipientAddress
    interval
    nextPaymentDue
  }
}
```

### Get Payment Events
```graphql
query {
  stableRentSubscription_PaymentProcesseds(first: 10) {
    subscriptionId
    amount
    processorFee
    timestamp
    paymentCount
  }
}
```

### Filter by Sender
```graphql
query {
  stableRentSubscription_SubscriptionCreateds(
    where: { senderAddress: "0xYourAddressHere" }
  ) {
    subscriptionId
    serviceName
    amount
  }
}
```

## 🐛 Troubleshooting

### Issue: Indexer can't connect to Hardhat

**Solution:**
- Ensure Hardhat node is running: `npx hardhat node`
- Check RPC URL in `config.local.yaml`: should be `http://127.0.0.1:8545`
- Verify Hardhat is listening on port 8545

### Issue: No events being indexed

**Solution:**
- Verify contract address in `config.local.yaml` matches deployed contract
- Check `../deployments/localhost.json` for the correct address
- Restart indexer after updating config
- Run: `pnpm codegen:local` to regenerate types

### Issue: Stale data

**Solution:**
```bash
# Clear Envio cache
rm -rf .envio

# Clear persisted state
rm -f persisted_state.envio.json

# Restart indexer
pnpm dev:local
```

### Issue: Contract address mismatch

**Solution:**
```bash
# From root directory
cd ..
npx tsx scripts/back-propagate-to-blockchain.ts

# This will update config.local.yaml with the correct address
cd envio
pnpm codegen:local
pnpm dev:local
```

## 📊 Monitoring

When the indexer is running, you'll see:
- Block sync progress
- Events being indexed
- GraphQL server running on port 8080

Example output:
```
✅ Indexing started
📊 Processing blocks: 0 -> 100
✅ Indexed 18 SubscriptionCreated events
✅ Indexed 54 PaymentProcessed events
🔗 GraphQL endpoint: http://localhost:8080/graphql
```

## 🔐 Environment Variables

Create an `envio.env` file for sensitive configuration:

```env
# Database (if using custom database)
DATABASE_URL=postgresql://user:password@localhost:5432/envio

# RPC URLs (if needed)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
LOCAL_RPC_URL=http://127.0.0.1:8545
```

**Note**: `envio.env` is gitignored for security.

## 📚 Additional Resources

- [Envio Documentation](https://docs.envio.dev/)
- [GraphQL Basics](https://graphql.org/learn/)
- [Local Testing Guide](../LOCAL_TESTING_GUIDE.md)

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start indexer (Sepolia) |
| `pnpm dev:local` | Start indexer (Local Hardhat) |
| `pnpm codegen` | Generate types (Sepolia) |
| `pnpm codegen:local` | Generate types (Local) |
| `pnpm test` | Run tests |

---

**Pro Tip**: Always use `pnpm dev:local` for local testing to avoid accidentally indexing production data!