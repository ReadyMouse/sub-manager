# Wallet Verification System

## Overview

StableRent uses **Sign-In With Ethereum (SIWE)** to verify wallet ownership. Users can connect multiple wallets for sending payments, and each wallet must be verified with a cryptographic signature.

## Two Types of Addresses

### 1. **ConnectedWallet** (Verified, For Sending)
- User **must prove ownership** by signing a message
- Used for **creating and paying** subscriptions
- Requires wallet interaction (MetaMask, WalletConnect, etc.)
- Can have multiple verified wallets per account

### 2. **PaymentAddress** (Unverified, For Receiving)
- User **just provides an address** (no signature needed)
- Used for **receiving payments only**
- Can be PayPal, Coinbase, any custodial service
- Perfect for landlords without wallets

## Wallet Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: User Requests to Connect Wallet                       │
└─────────────────────────────────────────────────────────────────┘

Frontend → Backend
POST /api/wallets/generate-message
{
  "walletAddress": "0x123..."
}

↓ Response:
{
  "message": "example.com wants you to sign in with your Ethereum account:\n0x123...\n\nBy signing, you prove ownership...",
  "nonce": "uuid-123"
}


┌─────────────────────────────────────────────────────────────────┐
│  Step 2: User Signs Message with Wallet                        │
└─────────────────────────────────────────────────────────────────┘

Frontend (using ethers.js or wagmi):
const signer = await provider.getSigner();
const signature = await signer.signMessage(message);


┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Backend Verifies Signature                            │
└─────────────────────────────────────────────────────────────────┘

Frontend → Backend
POST /api/wallets/connect
{
  "walletAddress": "0x123...",
  "signature": "0xabcd...",
  "message": "example.com wants you to sign in...",
  "label": "MetaMask"
}

Backend:
1. Recovers signer address from signature
2. Verifies it matches claimed walletAddress
3. Checks wallet not already connected to another account
4. Stores ConnectedWallet with verification proof

↓ Response:
{
  "success": true,
  "data": {
    "id": "wallet-uuid",
    "walletAddress": "0x123...",
    "isVerified": true,
    "isPrimary": true
  }
}
```

## Database Schema

```prisma
model ConnectedWallet {
  id              String  @id
  userId          String
  walletAddress   String
  
  // Verification Proof
  isVerified      Boolean
  verificationSignature String  // The signed message
  verificationMessage   String  // Original message
  verifiedAt      DateTime
  
  // Settings
  label           String  // "MetaMask", "Hardware Wallet", etc.
  isPrimary       Boolean // Default wallet for sending
  
  // Usage tracking
  sentSubscriptions Subscription[]
}
```

## API Endpoints

### Connect Wallet Flow

**1. Generate Message**
```bash
POST /api/wallets/generate-message
Authorization: Bearer <token>

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}

# Response:
{
  "success": true,
  "data": {
    "message": "Sign this message to prove ownership...",
    "nonce": "random-uuid"
  }
}
```

**2. Connect Wallet**
```bash
POST /api/wallets/connect
Authorization: Bearer <token>

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "signature": "0x1234...",
  "message": "Sign this message to prove ownership...",
  "label": "MetaMask Main"
}
```

### Manage Wallets

**Get All Wallets**
```bash
GET /api/wallets
Authorization: Bearer <token>

# Response:
{
  "success": true,
  "data": [
    {
      "id": "wallet-1",
      "walletAddress": "0x123...",
      "label": "MetaMask",
      "isPrimary": true,
      "isVerified": true,
      "connectedAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "wallet-2",
      "walletAddress": "0x456...",
      "label": "Hardware Wallet",
      "isPrimary": false,
      "isVerified": true,
      "connectedAt": "2025-01-02T00:00:00Z"
    }
  ]
}
```

**Set Primary Wallet**
```bash
PUT /api/wallets/:id/primary
Authorization: Bearer <token>
```

**Update Label**
```bash
PUT /api/wallets/:id/label
Authorization: Bearer <token>

{
  "label": "My Ledger"
}
```

**Disconnect Wallet**
```bash
DELETE /api/wallets/:id
Authorization: Bearer <token>
```

## Frontend Integration (React + ethers.js)

```typescript
import { ethers } from 'ethers';

// Step 1: Connect wallet
async function connectWallet() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  // Step 2: Get message to sign
  const response = await fetch('/api/wallets/generate-message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress: address }),
  });
  
  const { message } = await response.json().data;
  
  // Step 3: Sign message
  const signature = await signer.signMessage(message);
  
  // Step 4: Verify and connect
  const verifyResponse = await fetch('/api/wallets/connect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress: address,
      signature,
      message,
      label: 'MetaMask',
    }),
  });
  
  const result = await verifyResponse.json();
  console.log('Wallet connected:', result.data);
}
```

## Security Features

### 1. **Signature Verification**
- Backend uses `ethers.verifyMessage()` to recover signer
- Impossible to fake without private key
- Each signature is unique (contains nonce)

### 2. **One Wallet, One Account**
- Prevents wallet from being connected to multiple accounts
- Enforces account ownership

### 3. **Proof of Ownership**
- Signature and message stored in database
- Can be re-verified anytime
- Audit trail of all connected wallets

### 4. **Primary Wallet**
- User designates default wallet for sending
- Prevents confusion with multiple wallets
- Easy to switch primary wallet

## Use Cases

### **Scenario 1: User with Multiple Wallets**
```
User has:
- MetaMask (hot wallet) → Set as primary
- Ledger (hardware wallet) → Backup
- Coinbase wallet → For mobile

Can create subscriptions from any verified wallet!
```

### **Scenario 2: Shared Account**
```
Business account:
- Owner verifies company wallet
- Team members can't add random wallets
- Only verified wallets can send payments
```

### **Scenario 3: Account Recovery**
```
User loses access to primary wallet:
1. Switch to alternate verified wallet
2. Set as new primary
3. Disconnect old wallet
4. Business continuity maintained
```

## Comparison: ConnectedWallet vs PaymentAddress

| Feature | ConnectedWallet | PaymentAddress |
|---------|----------------|----------------|
| **Purpose** | Send payments | Receive payments |
| **Verification** | ✅ Required (signature) | ❌ Not required |
| **Wallet Required** | ✅ Yes (MetaMask, etc.) | ❌ No (can be PayPal) |
| **Multiple Per User** | ✅ Yes | ✅ Yes |
| **Primary Setting** | ✅ Yes | ✅ Yes (default) |
| **Can Create Subscriptions** | ✅ Yes | ❌ No |
| **Can Receive Payments** | ✅ Yes (if added) | ✅ Yes |

## Example: Complete User Journey

**New User (Tenant):**
1. Register with email/password → Gets `userId`
2. Connect MetaMask wallet → Verify with signature
3. Create subscription → Use verified wallet
4. Add hardware wallet → Verify with signature
5. Switch primary to hardware wallet

**Landlord (No Wallet):**
1. Register with email/password → Gets `userId`
2. Add PayPal address to `PaymentAddress` (no verification)
3. Share `userId` with tenants
4. Receive payments → Shows up in PayPal!

## Best Practices

1. **Always verify wallets** before allowing sends
2. **Don't require verification** for receive-only addresses
3. **Store signatures** for audit trail
4. **Implement wallet rotation** for security
5. **Support multiple wallets** for user flexibility
6. **Use SIWE standard** for consistency

## Testing

```bash
# Test signature verification
npm run test -- connectedWallet.test.ts

# Manual test with MetaMask
1. Open browser console
2. Connect MetaMask
3. Sign message
4. Verify signature matches
```

## Migration

If you have existing users with `walletAddress` field:

```sql
-- Migrate existing wallets to ConnectedWallet
INSERT INTO "ConnectedWallet" (id, userId, walletAddress, label, isPrimary, isVerified, connectedAt)
SELECT 
  gen_random_uuid(),
  id,
  walletAddress,
  'Migrated Wallet',
  true,
  false, -- Mark as unverified
  walletConnectedAt
FROM "User"
WHERE walletAddress IS NOT NULL;
```

## License

MIT

