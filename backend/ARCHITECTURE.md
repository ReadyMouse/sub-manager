# StableRent Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          StableRent Architecture                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │◄────────┤   Backend    │◄────────┤   Envio      │
│  (React +    │  REST   │  (Express +  │ Webhook │  (Indexer)   │
│   Wagmi)     │   API   │   Prisma)    │         │              │
└──────┬───────┘         └──────┬───────┘         └──────▲───────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         │
┌──────────────┐         ┌──────────────┐         ┌──────┴───────┐
│  Smart       │         │  PostgreSQL  │         │  Ethereum    │
│  Contract    │─────────┤   Database   │         │  Mainnet     │
│  (Hardhat)   │  Events │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Key Components

### 1. Frontend (React + TypeScript + Wagmi)
- User interface
- Wallet connection (MetaMask, WalletConnect)
- Smart contract interactions
- API calls to backend

### 2. Backend (Express + TypeScript + Prisma)
- **Purpose**: User management and subscription metadata
- **Why?** Smart contract cannot store emails, profile info, or complex metadata
- **Features**:
  - Email/password authentication (for users without wallets)
  - User profiles and preferences
  - Subscription metadata (notes, tags, categories)
  - Payment addresses management
  - Notifications

### 3. Smart Contract (Solidity + Hardhat)
- **Purpose**: Subscription logic and payment processing
- **Storage**: Minimal on-chain data (addresses, amounts, timestamps)
- **References**: User IDs link to off-chain database

### 4. Envio (Blockchain Indexer)
- **Purpose**: Index blockchain events and sync to backend
- **Features**:
  - Real-time event indexing
  - GraphQL API for frontend
  - Webhooks to backend

### 5. PostgreSQL Database
- User accounts and profiles
- Subscription metadata
- Payment history (synced from blockchain)
- Notifications

## Data Flow

### Creating a Subscription

```
┌────────────────────────────────────────────────────────────────────┐
│  1. User Registration & Login                                      │
└────────────────────────────────────────────────────────────────────┘

User → Frontend → Backend
                    │
                    ▼
              POST /api/auth/register
              { email, password, displayName }
                    │
                    ▼
              Create User in DB
              userId: "uuid-123"
                    │
                    ▼
              Return JWT token


┌────────────────────────────────────────────────────────────────────┐
│  2. Add Payment Address (for landlords without wallets)           │
└────────────────────────────────────────────────────────────────────┘

User → Frontend → Backend
                    │
                    ▼
              POST /api/users/me/payment-addresses
              {
                address: "0x742d...",
                currency: "PYUSD",
                addressType: "CUSTODIAL"
              }
                    │
                    ▼
              Store in PaymentAddress table


┌────────────────────────────────────────────────────────────────────┐
│  3. Create Subscription On-Chain                                   │
└────────────────────────────────────────────────────────────────────┘

Frontend:
  1. Get senderId from localStorage (logged in user)
  2. Look up recipient by wallet: GET /api/users/wallet/0x742d...
     → Returns recipientId
  3. Call smart contract:
     createSubscription(
       senderId: "uuid-123",        // Off-chain user ID
       recipientId: "uuid-456",     // Off-chain user ID
       amount: 1000000000,          // 1000 PYUSD
       interval: 2592000,           // 30 days
       serviceName: "Apartment Rent",
       recipientAddress: "0x742d...", // Actual payment address
       ...
     )


┌────────────────────────────────────────────────────────────────────┐
│  4. Blockchain Event → Envio → Backend                            │
└────────────────────────────────────────────────────────────────────┘

Smart Contract
      │
      ▼ emits SubscriptionCreated event
Envio Indexer
      │
      ▼ webhook
Backend
      │
      ▼ POST /api/webhooks/subscription-created
      {
        subscriptionId: "1",
        senderId: "uuid-123",
        recipientId: "uuid-456",
        ...
      }
      │
      ▼ Store in Subscription table
      │
      ▼ Create Notifications
      │
      ▼ Send emails (optional)


┌────────────────────────────────────────────────────────────────────┐
│  5. Frontend Queries Subscription Data                            │
└────────────────────────────────────────────────────────────────────┘

Frontend → Backend
             │
             ▼
       GET /api/subscriptions/sent
             │
             ▼
       Returns subscriptions with:
       - On-chain data (amount, interval)
       - Off-chain metadata (notes, tags)
       - Recipient info (name, email)
```

## Authentication Flow

### Email/Password Users (Landlords)

```
1. Register
   POST /api/auth/register
   { email, password, displayName }
   → Returns JWT + user

2. Login
   POST /api/auth/login
   { email, password }
   → Returns JWT + refresh token

3. Authenticated Requests
   GET /api/users/me
   Headers: { Authorization: "Bearer <token>" }

4. Add Payment Address
   POST /api/users/me/payment-addresses
   { address: "0x...", currency: "PYUSD", addressType: "CUSTODIAL" }

5. Receive Payments
   - Users create subscriptions to their userId
   - Payments sent to their PaymentAddress
   - No wallet needed!
```

### Wallet Users (Crypto-Native)

```
1. Register with Email First
   POST /api/auth/register
   { email, password, displayName }

2. Connect Wallet (Optional)
   POST /api/users/me/wallet
   { walletAddress: "0x..." }

3. Now have both:
   - Email/password login
   - Wallet address linked
```

## Database Schema Design

### Why This Schema?

**Single User Type**
- One `User` table for everyone
- `userType` field: REGULAR, ADMIN
- Flexible: same person can be tenant AND landlord

**Payment Addresses**
- Separate `PaymentAddress` table
- Users can have multiple addresses
- Supports: wallets, PayPal, exchanges, custodial

**Subscriptions**
- Links to `User` via `senderId` and `recipientId`
- Stores blockchain data + off-chain metadata
- Bidirectional: query sent OR received

### Key Relationships

```sql
User
  ├─► PaymentAddress (1:many)
  ├─► Subscription as sender (1:many)
  ├─► Subscription as recipient (1:many)
  ├─► Notification (1:many)
  ├─► Session (1:many)
  └─► UserPreferences (1:1)

Subscription
  ├─► User (sender) (many:1)
  ├─► User (recipient) (many:1)
  ├─► PaymentAddress (recipient) (many:1)
  └─► Payment (1:many)
```

## API Design Principles

### RESTful Endpoints

- **Resource-based**: `/api/users`, `/api/subscriptions`
- **HTTP verbs**: GET (read), POST (create), PUT (update), DELETE
- **Nested resources**: `/api/users/me/payment-addresses`

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Format

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Authentication

```
Authorization: Bearer <JWT_TOKEN>
```

## Security Layers

1. **Input Validation** (express-validator + Zod)
2. **Rate Limiting** (express-rate-limit)
3. **CORS** (restricted to frontend URL)
4. **Helmet** (security headers)
5. **JWT Authentication** (jsonwebtoken)
6. **Password Hashing** (bcrypt with 12 rounds)
7. **SQL Injection Protection** (Prisma ORM)
8. **Webhook Signature Verification** (HMAC-SHA256)

## Scalability Considerations

### Horizontal Scaling
- Stateless API (JWT in headers)
- Session data in database
- Can run multiple instances behind load balancer

### Database Optimization
- Indexes on frequently queried fields
- Composite indexes for multi-field queries
- Pagination for large result sets

### Caching Strategy (Future)
- Redis for session storage
- Cache user profiles
- Cache active subscriptions

## Development Workflow

```bash
# 1. Update schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_new_feature

# 3. Generate Prisma client
npm run prisma:generate

# 4. Update types
vim src/types/index.ts

# 5. Update service
vim src/services/userService.ts

# 6. Update controller
vim src/controllers/userController.ts

# 7. Update routes
vim src/routes/users.ts

# 8. Test
npm run dev
```

## Deployment Architecture

### Current Production Setup

```
┌─────────────────┐
│   Vercel        │ ← Frontend (React)
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Railway       │ ← Backend (Express + Prisma)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Railway       │ ← PostgreSQL Database (included)
└─────────────────┘
```

### Environment Variables by Service

**Frontend (Vercel)**
```bash
VITE_API_URL=https://api.stablerent.com
VITE_CONTRACT_ADDRESS=0x...
```

**Backend (Railway)**
```bash
DATABASE_URL=postgresql://... (auto-set by Railway)
FRONTEND_URL=https://stablerent.vercel.app
JWT_SECRET=... (generated with openssl rand -base64 32)
ENVIO_WEBHOOK_SECRET=... (generated with openssl rand -hex 32)
CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1
API_URL=https://backend-production-a05e.up.railway.app
```

## Future Enhancements

1. **Email Service** - SendGrid/Postmark integration
2. **WebSocket** - Real-time notifications
3. **GraphQL API** - Alternative to REST
4. **Background Jobs** - Bull queue for async tasks
5. **Analytics** - Track user behavior
6. **Admin Dashboard** - User management UI
7. **2FA** - Two-factor authentication
8. **KYC Integration** - Identity verification

## Questions & Answers

### Why not just use Envio's GraphQL API?

Envio only indexes blockchain data. We need:
- User emails and passwords
- Profile pictures and bios
- Subscription notes and tags
- Notification preferences
- Payment addresses for non-wallet users

### Why separate User and PaymentAddress tables?

- Users can have multiple payment addresses
- Same user can receive PYUSD, USDC, ETH, etc.
- Supports PayPal users without wallets
- Allows address rotation for privacy

### How do non-wallet users create subscriptions?

They can't! Non-wallet users are **recipients only** (landlords, service providers). They:
1. Register with email/password
2. Add their PayPal PYUSD address
3. Share their userId with tenants
4. Receive payments without a wallet

Payers (tenants) need a wallet to approve PYUSD spending.

### What happens if blockchain and database get out of sync?

Envio webhooks handle this automatically:
- Retries on failure (3 attempts)
- Events are immutable on blockchain
- Can replay events from Envio
- `lastSyncedAt` field tracks sync status

## License

MIT

