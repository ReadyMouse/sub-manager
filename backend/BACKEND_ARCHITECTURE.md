# StableRent Backend Architecture

## Overview

The StableRent backend is a Node.js/Express API that manages user authentication, subscription metadata, and integrates with blockchain events. It serves as the bridge between the frontend and on-chain data.

## Tech Stack

- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator + Zod
- **Security**: helmet, CORS, rate limiting

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server startup and graceful shutdown
│   ├── config/
│   │   ├── database.ts     # Prisma client
│   │   └── env.ts          # Environment validation
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic
│   └── types/             # TypeScript type definitions
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Database seeding
├── railway.json          # Railway deployment config
└── package.json          # Dependencies and scripts
```

## API Design

### RESTful Endpoints

```
/api/auth/*              # Authentication
/api/users/*             # User management
/api/subscriptions/*     # Subscription CRUD
/api/payments/*          # Payment history
/api/notifications/*     # User notifications
/api/webhooks/*          # Blockchain event handlers
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Database Schema

### Core Tables

- **User** - User accounts and profiles
- **PaymentAddress** - User payment addresses (wallets, PayPal, etc.)
- **Subscription** - Subscription metadata and on-chain references
- **Payment** - Payment history synced from blockchain
- **Notification** - User notifications
- **Session** - JWT session management

### Key Relationships

```
User (1) ──► PaymentAddress (many)
User (1) ──► Subscription as sender (many)
User (1) ──► Subscription as recipient (many)
User (1) ──► Notification (many)
User (1) ──► Session (many)
```

## Authentication Flow

### JWT-Based Authentication

1. **Login**: `POST /api/auth/login`
   - Validates email/password
   - Returns JWT + refresh token

2. **Protected Routes**: `Authorization: Bearer <token>`
   - Middleware validates JWT
   - Extracts user ID from token

3. **Token Refresh**: `POST /api/auth/refresh`
   - Validates refresh token
   - Issues new JWT

### User Types

- **REGULAR**: Standard users (tenants/landlords)
- **ADMIN**: System administrators

## Security Features

1. **Input Validation** - Zod schemas for all inputs
2. **Rate Limiting** - 100 requests per 15 minutes
3. **CORS Protection** - Restricted to frontend domain
4. **Helmet Security** - Security headers
5. **Password Hashing** - bcrypt with 12 rounds
6. **SQL Injection Protection** - Prisma ORM
7. **Webhook Verification** - HMAC-SHA256 signatures

## Blockchain Integration

### Envio Webhooks

The backend receives blockchain events via webhooks:

```
Smart Contract Event → Envio Indexer → Webhook → Backend
```

**Webhook Endpoints:**
- `POST /api/webhooks/subscription-created`
- `POST /api/webhooks/payment-processed`
- `POST /api/webhooks/subscription-cancelled`

### Event Processing

1. **Verify webhook signature** (HMAC-SHA256)
2. **Parse event data** from blockchain
3. **Update database** with new information
4. **Create notifications** for affected users
5. **Send emails** (optional)

## Deployment (Railway)

### Configuration

- **Build**: `npm run prisma:generate && npm run build`
- **Start**: `npm start`
- **Database**: PostgreSQL (included)
- **Environment**: Production

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://... (auto-set)
NODE_ENV=production
API_URL=https://backend-production-a05e.up.railway.app
FRONTEND_URL=https://stablerent.vercel.app
JWT_SECRET=<32-char-secret>
REFRESH_TOKEN_SECRET=<32-char-secret>
ENVIO_WEBHOOK_SECRET=<hex-secret>
CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1

# Optional
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_api_key
FROM_EMAIL=noreply@stablerent.app
```

## Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp env.example .env
# Edit .env with your values

# 3. Database setup
npm run prisma:generate
npm run prisma:migrate

# 4. Start development server
npm run dev
```

### Database Changes

```bash
# 1. Update schema
vim prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate

# 3. Generate client
npm run prisma:generate

# 4. Test changes
npm run dev
```

## Monitoring & Logs

### Railway Dashboard

- **Metrics**: CPU, memory, network usage
- **Logs**: Application logs and errors
- **Variables**: Environment variable management
- **Database**: PostgreSQL connection and queries

### CLI Commands

```bash
# View logs
railway logs --follow

# Check status
railway status

# Update variables
railway variables set KEY=value
```

## Error Handling

### Global Error Handler

All errors are caught and formatted consistently:

```typescript
{
  "success": false,
  "error": "User-friendly message",
  "details": { ... } // Development only
}
```

### Common Error Types

- **ValidationError** - Input validation failures
- **AuthenticationError** - Invalid/missing JWT
- **DatabaseError** - Database connection issues
- **WebhookError** - Invalid webhook signatures

## Performance Considerations

### Database Optimization

- **Indexes** on frequently queried fields
- **Composite indexes** for multi-field queries
- **Pagination** for large result sets

### Caching Strategy (Future)

- **Redis** for session storage
- **Cache** user profiles
- **Cache** active subscriptions

## API Documentation

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T15:51:25.547Z",
  "message": "StableRent Backend API is running"
}
```

### API Info

```bash
GET /api
```

Returns available endpoints and API version.

## License

MIT
