# ⚡ Backend Quick Deploy - Railway (5 Minutes)

**Fastest path to deployed backend with PostgreSQL**

## Prerequisites
- [ ] Contracts deployed to Sepolia (have contract address)
- [ ] Railway account (sign up at https://railway.app/)

## Step 1: Install Railway CLI (1 min)
```bash
npm install -g @railway/cli
railway login
```

## Step 2: Initialize Project (1 min)
```bash
cd backend
railway init
# Choose: "Empty project"
# Name: stablerent-backend
```

## Step 3: Add PostgreSQL (30 seconds)
```bash
railway add
# Select: PostgreSQL
```
✅ `DATABASE_URL` is automatically set!

## Step 4: Set Environment Variables (2 min)
```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
REFRESH=$(openssl rand -base64 32)
WEBHOOK=$(openssl rand -hex 32)

# Set all variables at once
railway variables set \
  NODE_ENV=production \
  PORT=3001 \
  JWT_SECRET=$JWT_SECRET \
  JWT_EXPIRES_IN=7d \
  REFRESH_TOKEN_SECRET=$REFRESH \
  REFRESH_TOKEN_EXPIRES_IN=30d \
  ENVIO_WEBHOOK_SECRET=$WEBHOOK \
  DEFAULT_CHAIN_ID=11155111 \
  CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS_HERE \
  FRONTEND_URL=https://your-frontend.vercel.app \
  RATE_LIMIT_WINDOW_MS=900000 \
  RATE_LIMIT_MAX_REQUESTS=100

# Optional: Email (Resend.com)
railway variables set \
  SMTP_HOST=smtp.resend.com \
  SMTP_PORT=587 \
  SMTP_USER=resend \
  SMTP_PASSWORD=re_your_api_key \
  FROM_EMAIL=noreply@yourdomain.com \
  FROM_NAME=StableRent
```

**Replace these:**
- `YOUR_CONTRACT_ADDRESS_HERE` - Your deployed Sepolia contract
- `https://your-frontend.vercel.app` - Your deployed frontend URL
- `re_your_api_key` - Resend.com API key (optional)

## Step 5: Deploy (1 min)
```bash
railway up
```

Railway will automatically:
1. Install dependencies ✅
2. Generate Prisma client ✅
3. Build TypeScript ✅
4. Run database migrations ✅
5. Start server ✅

## Step 6: Get Your URL (10 seconds)
```bash
railway domain
```

Copy the URL (e.g., `https://stablerent-backend-production.up.railway.app`)

## Step 7: Test It! (10 seconds)
```bash
curl https://YOUR_RAILWAY_URL/health
```

Should return:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## ✅ You're Done!

Your backend is now:
- ✅ Deployed and running
- ✅ Connected to PostgreSQL database
- ✅ Secured with JWT authentication
- ✅ Ready to receive webhooks from Envio
- ✅ CORS configured for your frontend

## 🔗 Next Steps

1. **Update frontend** with backend URL:
   ```bash
   # In frontend/.env
   VITE_API_URL=https://your-railway-url
   ```

2. **Update Envio webhooks** with backend URL:
   ```yaml
   # In envio.config.yaml
   webhooks:
     - url: https://your-railway-url/webhook/payment-processed
   ```

3. **Redeploy frontend** with new backend URL

---

## 📊 Monitor Your Backend

```bash
# View logs
railway logs

# View in browser
railway open
```

Or visit: https://railway.app/dashboard

---

## 💰 Cost

- **Free**: $5 credit/month
- **Typical usage**: $3-5/month for small app
- **Credits reset**: Monthly

Plenty for hackathon demo and testing!

---

## 🐛 Troubleshooting

### Can't find `railway` command
```bash
npm install -g @railway/cli
```

### Need to update environment variables
```bash
# View current variables
railway variables

# Update single variable
railway variables set CONTRACT_ADDRESS=0xNew...

# Delete variable
railway variables delete VARIABLE_NAME
```

### View logs
```bash
railway logs --follow
```

### Restart service
```bash
railway up --detach
```

---

## 📚 Full Documentation

For more options and detailed guides, see:
- [backend/DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [../SEPOLIA_DEPLOYMENT_GUIDE.md](../SEPOLIA_DEPLOYMENT_GUIDE.md) - Full system deployment

---

**Total time**: ~5 minutes  
**Difficulty**: Easy ⭐  
**Maintenance**: Automatic updates via Railway  

Enjoy your deployed backend! 🚀

