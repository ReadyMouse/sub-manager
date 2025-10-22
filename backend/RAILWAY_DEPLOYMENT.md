# 🚂 Railway Backend Deployment Guide

**Complete guide for deploying StableRent backend to Railway with PostgreSQL**

---

## 🎯 Why Railway?

- ✅ **Express.js optimized** - Perfect for Node.js apps
- ✅ **Built-in PostgreSQL** - No external database setup needed
- ✅ **Automatic deployments** - Git push triggers deployment
- ✅ **Free tier** - $5 credit/month (plenty for hackathon)
- ✅ **5-minute setup** - Fastest path to production

---

## 📋 Prerequisites

- [ ] Railway account (sign up at https://railway.app/)
- [ ] Smart contract deployed to Sepolia (have contract address)
- [ ] Frontend deployed to Vercel (have frontend URL)

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
cd backend
railway init
```

**Follow prompts:**
- Project name: `stablerent-backend`
- Start with: `Empty project`

### Step 3: Add PostgreSQL Database

```bash
railway add
```

**Select:** `PostgreSQL`

✅ Railway automatically sets `DATABASE_URL` environment variable!

### Step 4: Set Environment Variables

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
ENVIO_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Set all required variables
railway variables set \
  NODE_ENV=production \
  PORT=3001 \
  API_URL=https://backend-production-a05e.up.railway.app \
  FRONTEND_URL=https://stablerent.vercel.app \
  JWT_SECRET=$JWT_SECRET \
  JWT_EXPIRES_IN=7d \
  REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET \
  REFRESH_TOKEN_EXPIRES_IN=30d \
  ENVIO_WEBHOOK_SECRET=$ENVIO_WEBHOOK_SECRET \
  DEFAULT_CHAIN_ID=11155111 \
  CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1 \
  RATE_LIMIT_WINDOW_MS=900000 \
  RATE_LIMIT_MAX_REQUESTS=100

# Optional: Email service (Resend.com)
railway variables set \
  SMTP_HOST=smtp.resend.com \
  SMTP_PORT=587 \
  SMTP_USER=resend \
  SMTP_PASSWORD=re_your_api_key \
  FROM_EMAIL=noreply@stablerent.app \
  FROM_NAME=StableRent
```

**Replace these values:**
- `CONTRACT_ADDRESS` - Your deployed Sepolia contract address
- `FRONTEND_URL` - Your deployed Vercel frontend URL
- `SMTP_PASSWORD` - Resend.com API key (optional)

### Step 5: Deploy

```bash
railway up
```

Railway automatically:
1. ✅ Installs dependencies
2. ✅ Generates Prisma client
3. ✅ Builds TypeScript
4. ✅ Runs database migrations
5. ✅ Starts server

### Step 6: Get Your URL

```bash
railway domain
```

Your backend will be available at: `https://backend-production-a05e.up.railway.app`

### Step 7: Test Deployment

```bash
curl https://backend-production-a05e.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T15:51:25.547Z",
  "message": "StableRent Backend API is running"
}
```

---

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `API_URL` | Backend URL | `https://backend-production-a05e.up.railway.app` |
| `FRONTEND_URL` | Frontend URL | `https://stablerent.vercel.app` |
| `JWT_SECRET` | JWT signing key | `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | Refresh token key | `openssl rand -base64 32` |
| `ENVIO_WEBHOOK_SECRET` | Webhook verification | `openssl rand -hex 32` |
| `CONTRACT_ADDRESS` | Smart contract address | `0xd91844e669a6138dc41fe1aEb0091822CC12f4d1` |
| `DEFAULT_CHAIN_ID` | Blockchain network | `11155111` (Sepolia) |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Email service host | `smtp.resend.com` |
| `SMTP_PORT` | Email service port | `587` |
| `SMTP_USER` | Email service user | `resend` |
| `SMTP_PASSWORD` | Email service password | `re_your_api_key` |
| `FROM_EMAIL` | Sender email | `noreply@stablerent.app` |
| `FROM_NAME` | Sender name | `StableRent` |

### Auto-Generated Variables

| Variable | Description | Set By |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Railway (automatic) |
| `RAILWAY_ENVIRONMENT` | Environment name | Railway (automatic) |
| `RAILWAY_PROJECT_ID` | Project identifier | Railway (automatic) |

---

## 📊 Monitoring & Management

### View Logs

```bash
# Real-time logs
railway logs --follow

# Recent logs
railway logs --lines 100
```

### Railway Dashboard

Visit: https://railway.app/dashboard

- 📊 **Metrics** - CPU, memory, network usage
- 📝 **Logs** - Application logs and errors
- ⚙️ **Variables** - Environment variable management
- 🔄 **Deployments** - Deployment history and status
- 🗄️ **Database** - PostgreSQL connection and queries

### Update Environment Variables

```bash
# View current variables
railway variables

# Update single variable
railway variables set CONTRACT_ADDRESS=0xNewAddress

# Delete variable
railway variables delete VARIABLE_NAME
```

### Redeploy

```bash
# Manual redeploy
railway up

# Redeploy with new environment variables
railway variables set NEW_VAR=value && railway up
```

---

## 🔗 Connect Frontend to Backend

### 1. Update Frontend Environment

Add to `frontend/.env`:

```env
VITE_API_URL=https://backend-production-a05e.up.railway.app
```

### 2. Redeploy Frontend

```bash
cd frontend
vercel deploy --prod
```

### 3. Update Backend with Frontend URL

```bash
railway variables set FRONTEND_URL=https://stablerent.vercel.app
```

---

## 🗄️ Database Management

### Run Migrations

```bash
# Connect to Railway and run migrations
railway run npm run prisma:migrate:deploy
```

### Access Database

```bash
# Open Prisma Studio
railway run npm run prisma:studio
```

### Reset Database (Development Only)

```bash
# ⚠️ WARNING: This deletes all data!
railway run npm run prisma:migrate:reset --force
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Application failed to respond" (502 Error)

**Cause:** Server not starting properly

**Solution:**
```bash
# Check logs
railway logs

# Common fixes:
# 1. Missing environment variables
# 2. Database connection issues
# 3. TypeScript compilation errors
```

#### "Cannot connect to database"

**Cause:** Database not accessible

**Solution:**
```bash
# Check DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test database connection
railway run npm run prisma:migrate:deploy
```

#### "CORS error" in Frontend

**Cause:** Frontend URL not configured

**Solution:**
```bash
# Set correct frontend URL
railway variables set FRONTEND_URL=https://your-frontend.vercel.app
```

#### "Module not found" errors

**Cause:** Dependencies not installed

**Solution:**
```bash
# Redeploy to reinstall dependencies
railway up
```

### Debug Commands

```bash
# Check service status
railway status

# View environment variables
railway variables

# Test database connection
railway run npx prisma db push

# View build logs
railway logs --lines 50
```

---

## 💰 Cost & Limits

### Railway Free Tier

- **$5 credit/month** (resets monthly)
- **Typical usage**: $3-5/month for small apps
- **Database**: 1GB PostgreSQL included
- **Bandwidth**: 100GB/month
- **Build time**: 500 minutes/month

### Upgrade Options

- **Pro Plan**: $20/month for higher limits
- **Team Plan**: $99/month for team collaboration

**For Hackathon**: Free tier is more than sufficient!

---

## 🚀 Production Checklist

- [ ] Railway account created
- [ ] Project initialized
- [ ] PostgreSQL database added
- [ ] All environment variables set
- [ ] Backend deployed successfully
- [ ] Health endpoint responding
- [ ] Database migrations run
- [ ] Frontend connected to backend
- [ ] CORS configured correctly
- [ ] Logs monitoring set up

---

## 📚 Next Steps

After successful deployment:

1. **Configure Envio webhooks** to point to your Railway backend
2. **Set up Gelato automation** for payment processing
3. **Test full user flow** (registration → subscription → payment)
4. **Monitor logs** for any issues
5. **Prepare demo video** showcasing the complete system

---

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: Create GitHub issue with logs

---

**Total deployment time**: ~5 minutes  
**Difficulty**: Easy ⭐  
**Maintenance**: Automatic via Railway  

Your backend is now production-ready! 🎉
