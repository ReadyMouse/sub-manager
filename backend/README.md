# StableRent Backend API

User management and subscription metadata backend for StableRent - a decentralized subscription management platform.

## Features

- 🔐 **Hybrid Authentication** - Email/password login with optional wallet connection
- 👤 **User Profiles** - Comprehensive user management for both payers and service providers
- 💳 **Payment Addresses** - Support for multiple payment addresses (PayPal, wallets, etc.)
- 📊 **Subscription Management** - Track and manage subscription metadata
- 🔔 **Notifications** - Real-time notifications for payment events
- 🪝 **Webhook Integration** - Sync with Envio blockchain indexer
- 🔒 **Security** - JWT authentication, rate limiting, helmet security headers

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken + bcrypt)
- **Validation:** express-validator + Zod
- **Security:** helmet, express-rate-limit, CORS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a PostgreSQL database and copy the environment variables:

```bash
cp env.example .env
```

Edit `.env` and update:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Strong random secret (min 32 chars)
- `REFRESH_TOKEN_SECRET` - Another strong random secret
- `ENVIO_WEBHOOK_SECRET` - Secret for Envio webhook verification
- `FRONTEND_URL` - Your frontend URL for CORS

### 3. Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate session)
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/wallet` - Connect wallet to account
- `DELETE /api/users/me/wallet` - Disconnect wallet
- `GET /api/users/me/preferences` - Get user preferences
- `PUT /api/users/me/preferences` - Update preferences
- `GET /api/users/me/payment-addresses` - Get payment addresses
- `POST /api/users/me/payment-addresses` - Add payment address
- `PUT /api/users/me/payment-addresses/:id` - Update payment address
- `DELETE /api/users/me/payment-addresses/:id` - Delete payment address
- `GET /api/users/wallet/:address` - Get user by wallet address

### Subscriptions

- `GET /api/subscriptions` - Get all subscriptions (sent + received)
- `GET /api/subscriptions/sent` - Get sent subscriptions
- `GET /api/subscriptions/received` - Get received subscriptions
- `GET /api/subscriptions/stats` - Get subscription statistics
- `GET /api/subscriptions/:id` - Get subscription details
- `PUT /api/subscriptions/:id/metadata` - Update subscription metadata

### Payments

- `GET /api/payments` - Get all payments (sent + received)
- `GET /api/payments/sent` - Get sent payments
- `GET /api/payments/received` - Get received payments

### Notifications

- `GET /api/notifications` - Get notifications
- `GET /api/notifications/count` - Get unread count
- `PUT /api/notifications/read-all` - Mark all as read
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Webhooks (Envio Integration)

- `POST /api/webhooks/subscription-created` - Handle subscription created event
- `POST /api/webhooks/payment-processed` - Handle payment processed event
- `POST /api/webhooks/payment-failed` - Handle payment failed event
- `POST /api/webhooks/subscription-cancelled` - Handle subscription cancelled event

## Database Schema

### User Management

- **User** - Core user accounts (email/password + optional wallet)
- **Session** - JWT session management
- **UserPreferences** - User settings and preferences
- **PaymentAddress** - Payment addresses for receiving funds

### Subscriptions

- **Subscription** - Subscription metadata synced from blockchain
- **Payment** - Payment history synced from blockchain
- **Notification** - User notifications

### Audit

- **AuditLog** - Audit trail for security and debugging

## User Flow

### Registration & Login

1. **Email/Password Registration**
   - User registers with email and password
   - Receives verification email
   - Account created with unique user ID

2. **Optional Wallet Connection**
   - User can connect wallet later
   - Wallet address linked to existing account
   - One wallet per account

3. **Payment Address Setup**
   - User adds payment addresses (PayPal, crypto wallets)
   - Can have multiple addresses for different currencies
   - Set default receive address

### Subscription Creation

1. User creates subscription on frontend
2. Frontend passes user IDs (senderId/recipientId) to smart contract
3. Smart contract emits SubscriptionCreated event
4. Envio indexes event and sends webhook to backend
5. Backend creates subscription record with metadata
6. Both sender and recipient receive notifications

### Payment Processing

1. Chainlink/Gelato processes payment on-chain
2. Smart contract emits PaymentProcessed event
3. Envio sends webhook to backend
4. Backend creates payment record
5. Both parties receive notifications

## Envio Webhook Verification

All webhooks verify the `x-envio-signature` header using HMAC-SHA256:

```typescript
const signature = crypto
  .createHmac('sha256', ENVIO_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Security

- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Password Hashing** - bcrypt with 12 rounds
- **Rate Limiting** - Different limits for different endpoints
- **Helmet** - Security headers
- **CORS** - Restricted to frontend URL
- **Input Validation** - express-validator + Zod
- **SQL Injection Protection** - Prisma ORM with parameterized queries

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Deployment

### Environment Variables

Ensure all environment variables are set in production:

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
REFRESH_TOKEN_SECRET="..."
ENVIO_WEBHOOK_SECRET="..."
FRONTEND_URL="https://your-frontend.com"
NODE_ENV="production"
```

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npx prisma generate
CMD ["npm", "start"]
```

### Recommended Hosts

- **Database:** Railway, Supabase, Neon
- **Backend:** Railway, Render, Fly.io, Heroku
- **Monitoring:** Sentry, LogRocket

## License

MIT

