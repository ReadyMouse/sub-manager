# Privacy-Focused Wallet-Only Authentication

## Overview

StableRent supports **three authentication modes**:

1. **Email/Password** - Traditional account (email required)
2. **Hybrid** - Email + connected wallets (most flexible)
3. **Wallet-Only** - Maximum privacy (NO email/password required) ✨

## Why Wallet-Only?

Privacy-conscious users can now use StableRent **without providing ANY personal information**:

- ❌ No email address
- ❌ No password to remember
- ❌ No personal data stored
- ✅ Just your wallet signature
- ✅ Complete pseudonymity
- ✅ Fully functional account

## User Verification Levels

All verification levels are **optional** and independent:

```prisma
enum VerificationLevel {
  WALLET       // Wallet-only (most private) - just wallet signature
  BASIC        // Email verified
  PHONE        // Phone number verified
  IDENTITY     // ID verification (KYC)
}
```

### Verification Matrix

| User Type | Email | Password | Wallet | Verification Level | Can Send | Can Receive |
|-----------|-------|----------|--------|-------------------|----------|-------------|
| Wallet-Only | ❌ | ❌ | ✅ | WALLET | ✅ | ✅ |
| Email-Only | ✅ | ✅ | ❌ | BASIC | ❌ | ✅ |
| Hybrid | ✅ | ✅ | ✅ | BASIC+ | ✅ | ✅ |

## Wallet-Only Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Generate Message                                       │
└─────────────────────────────────────────────────────────────────┘

POST /api/auth/wallet/generate-message
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}

↓ Response:
{
  "message": "StableRent wants you to sign in...\n0x742d...\n\nNonce: abc123",
  "nonce": "abc123"
}


┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Sign Message with Wallet                              │
└─────────────────────────────────────────────────────────────────┘

Frontend (using ethers/wagmi):
const signature = await signer.signMessage(message);


┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Register with Signature                               │
└─────────────────────────────────────────────────────────────────┘

POST /api/auth/register
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "signature": "0x1234abcd...",
  "message": "StableRent wants you to sign in...",
  "displayName": "Anonymous User"  // Only required field!
}

↓ Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "displayName": "Anonymous User",
      "walletAddress": "0x742d...",
      "verificationLevel": "WALLET",
      "isVerified": true
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}

→ User is registered and logged in!
   No email, no password, maximum privacy!
```

## Wallet-Only Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Same as Registration - Just Different Endpoint                │
└─────────────────────────────────────────────────────────────────┘

POST /api/auth/login
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "signature": "0x5678efgh...",
  "message": "StableRent wants you to sign in..."
}

→ User is logged in with wallet signature!
```

## Database Schema

```prisma
model User {
  // Email/Password (OPTIONAL for wallet-only users)
  email               String?  @unique  // Can be null!
  passwordHash        String?           // Can be null!
  
  // Wallet Auth (OPTIONAL)
  primaryWalletId     String?  @unique
  primaryWallet       ConnectedWallet?
  
  // Profile (displayName is REQUIRED)
  displayName         String   // Only required field
  firstName           String?
  lastName            String?
  phoneNumber         String?  // Back in schema, fully optional
  
  // Verification (ALL OPTIONAL)
  verificationLevel   VerificationLevel?
  isVerified          Boolean
}
```

## Three Authentication Modes Compared

### 1. Email/Password (Traditional)

```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepass123",
  "displayName": "John Doe"
}
```

**Pros:**
- Familiar UX
- Works everywhere
- Password recovery

**Cons:**
- Email required
- Password to remember
- Less private

**Can Send Payments:** ❌ No (needs wallet)
**Can Receive Payments:** ✅ Yes (with PaymentAddress)

### 2. Wallet-Only (Maximum Privacy)

```bash
POST /api/auth/register
{
  "walletAddress": "0x123...",
  "signature": "0xabc...",
  "message": "...",
  "displayName": "Anonymous"
}
```

**Pros:**
- No personal info
- Maximum privacy
- No passwords
- Cryptographically secure

**Cons:**
- Requires wallet
- Can't recover if wallet lost
- New concept for some users

**Can Send Payments:** ✅ Yes (verified wallet)
**Can Receive Payments:** ✅ Yes

### 3. Hybrid (Best of Both)

```bash
# Register with email
POST /api/auth/register
{ "email": "user@example.com", ... }

# Then connect wallet
POST /api/wallets/connect
{ "walletAddress": "0x123...", "signature": "0xabc..." }
```

**Pros:**
- Account recovery via email
- Send payments with wallet
- Most flexible

**Cons:**
- More setup steps
- Provides email (less private)

**Can Send Payments:** ✅ Yes
**Can Receive Payments:** ✅ Yes

## Frontend Implementation

### React + ethers.js

```typescript
// Wallet-Only Registration
async function registerWithWallet() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  // Step 1: Get message to sign
  const { message } = await fetch('/api/auth/wallet/generate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: address }),
  }).then(r => r.json()).then(r => r.data);
  
  // Step 2: Sign message
  const signature = await signer.signMessage(message);
  
  // Step 3: Register
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: address,
      signature,
      message,
      displayName: 'Anonymous User',
    }),
  });
  
  const { user, token } = await response.json().then(r => r.data);
  
  // Store token
  localStorage.setItem('token', token);
  
  console.log('Registered with wallet only!', user);
  // user.email === undefined
  // user.verificationLevel === 'WALLET'
}

// Wallet-Only Login
async function loginWithWallet() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  // Get message
  const { message } = await fetch('/api/auth/wallet/generate-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: address }),
  }).then(r => r.json()).then(r => r.data);
  
  // Sign message
  const signature = await signer.signMessage(message);
  
  // Login
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: address,
      signature,
      message,
    }),
  });
  
  const { user, token } = await response.json().then(r => r.data);
  localStorage.setItem('token', token);
  
  console.log('Logged in with wallet!', user);
}
```

## API Endpoints

### Generate SIWE Message

```bash
POST /api/auth/wallet/generate-message

Request:
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
}

Response:
{
  "success": true,
  "data": {
    "message": "StableRent wants you to sign in with your Ethereum account:\n0x742d...",
    "nonce": "random-uuid"
  }
}
```

### Register (Wallet-Only)

```bash
POST /api/auth/register

Request:
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "signature": "0x1234...",
  "message": "StableRent wants you to sign in...",
  "displayName": "My Pseudonym",
  "firstName": "optional",  // Optional
  "lastName": "optional",   // Optional
  "phoneNumber": "+1234"    // Optional
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "displayName": "My Pseudonym",
      "walletAddress": "0x742d...",
      "verificationLevel": "WALLET",
      "isVerified": true,
      "email": null  // No email!
    },
    "token": "jwt-...",
    "refreshToken": "refresh-..."
  },
  "message": "Wallet registered successfully. You are now signed in."
}
```

### Login (Wallet-Only)

```bash
POST /api/auth/login

Request:
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "signature": "0x5678...",
  "message": "StableRent wants you to sign in..."
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-...",
    "refreshToken": "refresh-..."
  }
}
```

## Security Considerations

### Signature Verification

1. **Nonce prevents replay attacks** - Each message has unique nonce
2. **Signature proves wallet ownership** - Can't be faked
3. **Message includes domain** - Prevents phishing attacks
4. **Timestamp in message** - Limits validity window

### Privacy Benefits

- **No email leaks** - Can't be traced via email
- **No password breaches** - No password to steal
- **Pseudonymous** - Only blockchain address visible
- **No PII storage** - Minimal data stored

### Account Recovery

**⚠️ Warning:** Wallet-only users **cannot recover account if wallet is lost!**

**Best Practices:**
1. Use hardware wallet (Ledger, Trezor)
2. Backup seed phrase securely
3. Consider hybrid mode for critical accounts
4. Test with small amounts first

## Use Cases

### 1. Privacy-Focused Crypto Native

```
User wants maximum privacy:
- Register with wallet only
- Use ENS name as displayName
- Never provide email
- Create subscriptions pseudonymously
```

### 2. Testing/Development

```
Developer testing:
- Quick registration with test wallet
- No email verification wait
- Instant testing
```

### 3. Temporary Accounts

```
User wants short-term account:
- Register with burner wallet
- Use for single subscription
- Dispose of account
```

### 4. Web3-First Users

```
Crypto-native user:
- Already has wallet
- Doesn't want email account
- Prefers blockchain-based identity
```

## Migration Path

Users can upgrade from wallet-only to hybrid:

```typescript
// Start: Wallet-only user (no email)
const user = { id: "123", email: null, primaryWalletId: "wallet-456" };

// Add email later (optional)
await fetch('/api/users/me', {
  method: 'PUT',
  body: JSON.stringify({
    // Still no email required!
    phoneNumber: "+1234567890"  // Just added phone
  })
});

// Or create password later to enable email login
// (would need new endpoint)
```

## Comparison with Sign-In With Ethereum (SIWE)

StableRent implements **SIWE-compatible** authentication:

| Feature | StableRent | Standard SIWE |
|---------|----------|---------------|
| Message Format | ✅ SIWE-compatible | ✅ Standard |
| Signature Verification | ✅ ethers.js | ✅ Standard |
| Session Management | ✅ JWT + DB | Varies |
| Email Optional | ✅ Yes | Usually required |
| Multiple Wallets | ✅ Yes | Varies |

## Best Practices

1. **Clear UX** - Explain wallet-only mode to users
2. **Backup warnings** - Warn about wallet loss = account loss
3. **ENS support** - Allow ENS names as displayName
4. **Easy upgrade** - Let users add email later if desired
5. **Hybrid recommended** - For most users, suggest hybrid mode

## Testing

```bash
# Test wallet-only registration
curl -X POST http://localhost:3001/api/auth/wallet/generate-message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"}'

# Sign message with wallet...

curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "signature": "0x...",
    "message": "...",
    "displayName": "Test User"
  }'
```

## License

MIT

