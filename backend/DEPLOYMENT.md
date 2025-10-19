# 🚀 Backend Deployment Guide

Complete guide for deploying the StableRent backend API to production.

---

## 🎯 Hosting Options Comparison

| Platform | Best For | Database | Price | Setup Time |
|----------|----------|----------|-------|------------|
| **Railway** | Express.js + Postgres | ✅ Included | $5/month free credit | 5 min |
| **Render** | Ease of use | ✅ Included | Free tier available | 10 min |
| **Vercel** | Serverless | External needed | Free tier | 15 min |

**Recommendation**: Use **Railway** for the easiest setup with included PostgreSQL database.

---

## 🚂 Option 1: Railway (Recommended)

Railway is perfect for Express.js apps with built-in PostgreSQL.

### Step 1: Sign Up and Install CLI

```bash
# Sign up at https://railway.app/

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login
```

### Step 2: Create Project

```bash
cd backend

# Initialize Railway project
railway init

# Follow prompts:
# - Project name: stablerent-backend
# - Start with: Empty project
```

### Step 3: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add

# Select: PostgreSQL
```

Railway will automatically:
- Create a PostgreSQL database
- Set `DATABASE_URL` environment variable
- Link it to your project

### Step 4: Set Environment Variables

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
ENVIO_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET
railway variables set ENVIO_WEBHOOK_SECRET=$ENVIO_WEBHOOK_SECRET
railway variables set JWT_EXPIRES_IN=7d
railway variables set REFRESH_TOKEN_EXPIRES_IN=30d
railway variables set DEFAULT_CHAIN_ID=11155111
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Contract address (add after deploying contracts)
railway variables set CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS

# Frontend URL (add after deploying frontend)
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# Email configuration (optional - Resend.com example)
railway variables set SMTP_HOST=smtp.resend.com
railway variables set SMTP_PORT=587
railway variables set SMTP_USER=resend
railway variables set SMTP_PASSWORD=re_your_api_key
railway variables set FROM_EMAIL=noreply@yourdomain.com
railway variables set FROM_NAME=StableRent
```

### Step 5: Deploy

```bash
# Deploy to Railway
railway up

# Railway will:
# 1. Install dependencies
# 2. Generate Prisma client
# 3. Build TypeScript
# 4. Run migrations
# 5. Start server
```

### Step 6: Get Your URL

```bash
# Generate public URL
railway domain

# Your backend will be available at:
# https://stablerent-backend-production.up.railway.app
```

### Step 7: Run Database Migrations

```bash
# Connect to your Railway project
railway run npm run prisma:migrate:deploy
```

### Railway Dashboard Management

Access at: https://railway.app/dashboard

- View logs
- Monitor usage
- Manage environment variables
- Check database connection

---

## 🎨 Option 2: Render

Render provides automatic deploys from GitHub with free PostgreSQL.

### Step 1: Push to GitHub

```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Prepare backend for deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com/
2. Sign up (can use GitHub OAuth)

### Step 3: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `stablerent-backend`
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:migrate:deploy && npm start`
   - **Plan**: Free

### Step 4: Add PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `stablerent-db`
   - **Database**: `stablerent`
   - **User**: `stablerent`
   - **Region**: Same as web service
   - **Plan**: Free

3. After creation, copy the **Internal Database URL**

### Step 5: Link Database to Web Service

1. Go to your web service
2. Click **"Environment"**
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL

### Step 6: Add All Environment Variables

In the Environment tab, add:

```
NODE_ENV=production
PORT=10000
API_URL=https://stablerent-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
DEFAULT_CHAIN_ID=11155111
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=<generate with: openssl rand -base64 32>
REFRESH_TOKEN_EXPIRES_IN=30d
ENVIO_WEBHOOK_SECRET=<generate with: openssl rand -hex 32>
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=StableRent
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 7: Deploy

Render will automatically deploy when you push to GitHub!

Your backend will be at: `https://stablerent-backend.onrender.com`

**Note**: Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## ☁️ Option 3: Vercel

Vercel works for Express.js but requires external database.

### Step 1: Add Vercel Postgres

1. Go to https://vercel.com/dashboard
2. Click **"Storage"** → **"Create Database"** → **"Postgres"**
3. Copy the `DATABASE_URL` from the `.env.local` tab

### Step 2: Configure for Vercel

Already done! The `backend/vercel.json` file is ready.

### Step 3: Deploy

```bash
cd backend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel deploy --prod
```

### Step 4: Set Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables, add all variables from `.env.production.example`

### Step 5: Run Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your_vercel_postgres_url"

# Run migrations
npm run prisma:migrate:deploy
```

---

## 📧 Email Service Setup (Optional)

For sending notifications to users.

### Resend.com (Recommended - Easiest)

1. Sign up at https://resend.com/
2. Free tier: 100 emails/day, 3,000/month
3. Get API key from dashboard
4. Use these settings:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### Gmail (Alternative)

1. Enable 2FA on your Google account
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use these settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
FROM_EMAIL=your-email@gmail.com
```

---

## 🔐 Generate Secure Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Refresh Token Secret (32+ characters)
openssl rand -base64 32

# Envio Webhook Secret (hex format)
openssl rand -hex 32
```

---

## 🧪 Test Your Deployment

### 1. Health Check

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "environment": "production",
  "database": "connected"
}
```

### 2. API Info

```bash
curl https://your-backend-url.com/api
```

Should return API documentation.

### 3. Database Connection

Check the health endpoint shows `"database": "connected"`

---

## 🔗 Connect Frontend to Backend

After deploying backend:

1. Add to `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.com
```

2. Redeploy frontend:
```bash
cd frontend
vercel deploy --prod
```

3. Update backend with frontend URL:
```bash
# Railway
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# Render - update in dashboard

# Vercel - update in dashboard
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"

**Railway/Render**: 
- Check DATABASE_URL is set automatically
- View logs: `railway logs` or Render dashboard

**Vercel**: 
- Make sure you added Vercel Postgres
- Copy exact connection string including SSL parameters

### "CORS error"

Make sure `FRONTEND_URL` matches your deployed frontend exactly (no trailing slash).

### "Prisma client not generated"

```bash
# Railway
railway run npm run prisma:generate

# Render
# Will run automatically on next deploy

# Vercel
npm run prisma:generate && vercel deploy --prod
```

### "Module not found"

Make sure `postinstall` script in `package.json` runs `prisma generate`.

### Render service sleeping

Free tier sleeps after 15 minutes. Consider:
- Upgrading to paid tier ($7/month for always-on)
- Using Railway instead (better free tier)
- Setting up a cron job to ping every 10 minutes

---

## 📊 Monitor Your Backend

### Railway
```bash
railway logs
```
Or view in dashboard: https://railway.app/dashboard

### Render
View logs in dashboard → Logs tab

### Vercel
View logs in dashboard → Deployments → View Function Logs

---

## 🚀 Quick Deployment Checklist

- [ ] Choose hosting platform (Railway recommended)
- [ ] Create account and install CLI
- [ ] Add PostgreSQL database
- [ ] Generate all secrets (JWT, webhook, etc.)
- [ ] Set all environment variables
- [ ] Deploy backend
- [ ] Run database migrations
- [ ] Test health endpoint
- [ ] Get backend URL
- [ ] Update frontend with backend URL
- [ ] Update backend with frontend URL
- [ ] Test full integration

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | $5 credit/month (enough for small app) | $5-20/month |
| Render | 750 hours/month (sleeps when idle) | $7/month always-on |
| Vercel | Serverless (generous limits) | Pay per usage |

**For Hackathon**: All free tiers are sufficient!

---

## 🎯 Recommended: Railway Quick Setup

If you want the fastest, most reliable setup:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and init
cd backend
railway login
railway init

# 3. Add database
railway add
# Select: PostgreSQL

# 4. Set required env vars (get these first!)
railway variables set NODE_ENV=production
railway variables set CONTRACT_ADDRESS=your_contract_address
railway variables set FRONTEND_URL=your_frontend_url
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
railway variables set ENVIO_WEBHOOK_SECRET=$(openssl rand -hex 32)

# 5. Deploy
railway up

# 6. Get URL
railway domain

# Done! 🎉
```

---

Need help? Check the main [SEPOLIA_DEPLOYMENT_GUIDE.md](../SEPOLIA_DEPLOYMENT_GUIDE.md) or create an issue!

