# StableRent Backend Setup Guide

Complete setup instructions for the StableRent backend API.

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- PostgreSQL 14+ (or access to a cloud PostgreSQL database)
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL

Install PostgreSQL locally and create a database:

```bash
# Install PostgreSQL (macOS with Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb stablerent

# Your DATABASE_URL will be:
# postgresql://your_username@localhost:5432/stablerent
```

#### Option B: Cloud PostgreSQL (Recommended for Production)

**Railway** (Free tier available):
1. Go to https://railway.app
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from the variables tab

**Supabase** (Free tier available):
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection String (URI mode)
4. Copy the connection string

**Neon** (Free tier available):
1. Go to https://neon.tech
2. Create new project
3. Copy the connection string from dashboard

### 3. Environment Configuration

Create `.env` file in the `backend` directory:

```bash
cp env.example .env
```

Edit `.env` with your values:

```bash
# Database - Use your actual PostgreSQL URL
DATABASE_URL="postgresql://user:password@host:5432/database"

# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secrets - Generate strong random strings
# You can use: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-characters
REFRESH_TOKEN_EXPIRES_IN=30d

# Email Service (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@stablerent.app
FROM_NAME=StableRent

# Envio Webhook Secret (will be provided by Envio)
ENVIO_WEBHOOK_SECRET=your-envio-webhook-secret

# Blockchain
DEFAULT_CHAIN_ID=1
CONTRACT_ADDRESS=0x... # Your deployed contract address

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Generating Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -base64 32
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up indexes and relationships
- Apply any future schema changes

### 6. (Optional) Seed Database with Test Data

```bash
npm run prisma:seed
```

This creates test users:
- **Landlord:** `landlord@example.com` (password: `password123`)
- **Tenant:** `tenant@example.com` (password: `password123`)
- **Business:** `business@example.com` (password: `password123`)

### 7. Start Development Server

```bash
npm run dev
```

The API will be running at: `http://localhost:3001`

### 8. Verify Installation

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/api
```

You should see a successful response with API information.

## Testing the API

### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User",
    "userType": "REGULAR"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response for authenticated requests.

### Get Current User (Authenticated)

```bash
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Add Payment Address

```bash
curl -X POST http://localhost:3001/api/users/me/payment-addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "currency": "PYUSD",
    "label": "My PayPal Address",
    "addressType": "CUSTODIAL",
    "isDefault": true
  }'
```

## Database Management

### Prisma Studio (Database GUI)

Open Prisma Studio to view and edit your database:

```bash
npm run prisma:studio
```

Navigate to: `http://localhost:5555`

### Create a New Migration

When you change the schema (`prisma/schema.prisma`):

```bash
npx prisma migrate dev --name your_migration_description
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

## Integrating with Frontend

### Update Frontend Environment

In your frontend `.env`:

```bash
VITE_API_URL=http://localhost:3001/api
```

### Example Frontend API Call (TypeScript)

```typescript
// Register user
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    displayName: 'User Name',
    userType: 'REGULAR'
  })
});

const data = await response.json();
const { token, user } = data.data;

// Store token in localStorage
localStorage.setItem('token', token);

// Use token for authenticated requests
const userResponse = await fetch('http://localhost:3001/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Connecting to Smart Contract

When a user creates a subscription on-chain:

1. **Get User IDs**: Call `/api/users/me` to get `userId`
2. **Get Recipient**: Call `/api/users/wallet/{address}` to get recipient's `userId`
3. **Create Subscription**: Pass both IDs to smart contract's `createSubscription()`
4. **Sync**: Envio will automatically sync the subscription to the backend

## Envio Webhook Setup

1. Deploy your backend to a public URL (Railway, Render, etc.)
2. In Envio config (`envio.config.yaml`), update webhook URLs:

```yaml
webhooks:
  - name: subscription-created
    url: https://your-backend.com/api/webhooks/subscription-created
    secret: ${ENVIO_WEBHOOK_SECRET}
```

3. Use the same `ENVIO_WEBHOOK_SECRET` in your backend `.env`

## Troubleshooting

### "PrismaClient is unable to run in the browser"

Make sure you're running the backend, not trying to import Prisma in the frontend.

### "Password too short" error

Minimum password length is 8 characters. Update in `authService.ts` if needed.

### Database connection fails

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Test connection with: `npx prisma db pull`

### CORS errors from frontend

- Verify `FRONTEND_URL` in `.env` matches your frontend URL exactly
- Check frontend is making requests to correct backend URL

### JWT token expired

Tokens expire after 7 days by default. Use refresh token endpoint:

```bash
POST /api/auth/refresh
Body: { "refreshToken": "..." }
```

## Production Deployment

See [README.md](./README.md#deployment) for production deployment instructions.

## Need Help?

- Check [README.md](./README.md) for API documentation
- Review Prisma schema: `prisma/schema.prisma`
- Check logs for error messages
- Verify environment variables are set correctly

