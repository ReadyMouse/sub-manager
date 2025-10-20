# 🚀 Vercel Setup Guide for StableRent

Complete walkthrough for deploying your StableRent application to Vercel.

---

## ✅ Prerequisites Completed
- [x] Vercel account created
- [x] Vercel CLI installed
- [x] Logged in to Vercel

---

## 🎯 What You'll Deploy

### Frontend (React + Vite) → Vercel ✅ Perfect fit!
- Easy deployment
- Automatic builds
- Fast CDN delivery

### Backend (Express API) → Railway Recommended
- Vercel works but requires external database
- Railway includes PostgreSQL and is easier
- See backend deployment section below

---

## 📱 **Part 1: Deploy Frontend to Vercel**

### Step 1: Navigate to Frontend Directory

```bash
cd /Users/mouse/src/sub-manager/frontend
```

### Step 2: Set Up Environment Variables

Create a `.env.production` file in the frontend directory:

```env
# Backend API URL (you'll update this after deploying backend)
VITE_API_URL=http://localhost:3001

# Your deployed contract address on Sepolia
VITE_CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1

# PYUSD Token Address on Sepolia
VITE_PYUSD_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53

# Chain configuration
VITE_DEFAULT_CHAIN=sepolia

# RPC URLs (get free Alchemy API key from https://www.alchemy.com/)
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
VITE_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
VITE_WALLET_CONNECT_PROJECT_ID=YOUR_PROJECT_ID

# Envio Indexer Endpoint (optional - for event tracking)
VITE_ENVIO_ENDPOINT=http://localhost:8080/graphql
```

### Step 3: Deploy Frontend

```bash
cd frontend

# Deploy to Vercel (production)
vercel --prod
```

**During deployment, Vercel will ask you:**

1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → Select your account
3. **Link to existing project?** → `N` (No, create new)
4. **What's your project's name?** → `stablerent-frontend` (or your choice)
5. **In which directory is your code located?** → `.` (current directory)
6. **Want to override settings?** → `N` (No)

### Step 4: Add Environment Variables in Vercel Dashboard

After deployment completes:

1. Go to https://vercel.com/dashboard
2. Select your `stablerent-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from your `.env.production` file:
   - Variable name: `VITE_CONTRACT_ADDRESS`
   - Value: `0xd91844e669a6138dc41fe1aEb0091822CC12f4d1`
   - Environment: **Production**, **Preview**, **Development** (select all)
   - Click **Save**
5. Repeat for all other `VITE_*` variables

### Step 5: Redeploy to Apply Environment Variables

```bash
vercel --prod
```

### ✅ Frontend Deployment Complete!

Your frontend will be live at: `https://stablerent-frontend-YOUR_USERNAME.vercel.app`

---

## 🔧 **Part 2: Deploy Backend**

You have two options:

### **Option A: Railway (Recommended - Easiest)**

Railway includes PostgreSQL database and is perfect for Express apps.

#### Quick Railway Setup:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to backend
cd /Users/mouse/src/sub-manager/backend

# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add
# Select: PostgreSQL

# Set environment variables
railway variables set NODE_ENV=production
railway variables set CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1
railway variables set DEFAULT_CHAIN_ID=11155111
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
railway variables set ENVIO_WEBHOOK_SECRET=$(openssl rand -hex 32)
railway variables set FRONTEND_URL=https://your-frontend-url.vercel.app

# Deploy
railway up

# Get your backend URL
railway domain
```

**Cost**: $5/month free credit (sufficient for development/demos)

---

### **Option B: Vercel (Requires External Database)**

If you prefer to use Vercel for everything:

#### 1. Create Vercel Postgres Database

1. Go to https://vercel.com/dashboard
2. Click **Storage** → **Create Database** → **Postgres**
3. Name it: `stablerent-db`
4. Copy the `DATABASE_URL` from the `.env.local` tab

#### 2. Deploy Backend to Vercel

```bash
cd /Users/mouse/src/sub-manager/backend

# Deploy
vercel --prod
```

#### 3. Add Environment Variables

In Vercel dashboard → Backend project → Settings → Environment Variables:

```env
NODE_ENV=production
DATABASE_URL=your_vercel_postgres_connection_string
CONTRACT_ADDRESS=0xd91844e669a6138dc41fe1aEb0091822CC12f4d1
DEFAULT_CHAIN_ID=11155111
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=<generate with: openssl rand -base64 32>
REFRESH_TOKEN_EXPIRES_IN=30d
ENVIO_WEBHOOK_SECRET=<generate with: openssl rand -hex 32>
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 4. Run Database Migrations

```bash
# Set your DATABASE_URL
export DATABASE_URL="your_vercel_postgres_url"

# Run migrations
cd backend
npm run prisma:migrate:deploy
```

---

## 🔗 **Part 3: Connect Frontend & Backend**

### 1. Update Frontend with Backend URL

After backend is deployed, get your backend URL and update frontend:

**In Vercel Dashboard:**
1. Go to your **frontend** project
2. Settings → Environment Variables
3. Update `VITE_API_URL`:
   - Railway: `https://your-app-name.up.railway.app`
   - Vercel: `https://stablerent-backend-YOUR_USERNAME.vercel.app`

### 2. Update Backend with Frontend URL

**Railway:**
```bash
railway variables set FRONTEND_URL=https://your-frontend.vercel.app
```

**Vercel:**
Update `FRONTEND_URL` in backend environment variables

### 3. Redeploy Both

```bash
# Redeploy frontend
cd frontend
vercel --prod

# Redeploy backend (if using Vercel)
cd ../backend
vercel --prod
```

---

## 🧪 **Test Your Deployment**

### 1. Test Frontend
Visit your frontend URL: `https://your-frontend.vercel.app`
- Should load the StableRent homepage
- Check browser console for errors

### 2. Test Backend
```bash
curl https://your-backend-url/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T...",
  "environment": "production",
  "database": "connected"
}
```

### 3. Test Full Integration
1. Open your frontend
2. Connect your wallet (MetaMask on Sepolia network)
3. Try to view dashboard
4. Check if API calls work (open browser DevTools → Network tab)

---

## 📝 **Getting Required API Keys**

### Alchemy (Free - for RPC access)
1. Go to https://www.alchemy.com/
2. Sign up for free account
3. Create new app:
   - Chain: Ethereum
   - Network: Sepolia (for testnet)
4. Copy API key
5. Your RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

### WalletConnect (Free - for wallet connections)
1. Go to https://cloud.walletconnect.com/
2. Sign up for free
3. Create new project
4. Copy Project ID
5. Add to `VITE_WALLET_CONNECT_PROJECT_ID`

---

## 🐛 **Troubleshooting**

### Frontend Build Fails
- Check all `VITE_*` environment variables are set
- Try building locally first: `npm run build`
- Check Vercel build logs in dashboard

### Backend Database Connection Fails
- **Vercel**: Make sure `DATABASE_URL` includes `?sslmode=require`
- **Railway**: DATABASE_URL is set automatically
- Check connection string format

### CORS Errors
- Make sure `FRONTEND_URL` in backend matches your frontend exactly
- No trailing slash in URLs
- Check browser console for exact error

### API Calls Failing
- Verify `VITE_API_URL` in frontend environment variables
- Test backend health endpoint directly
- Check Network tab in browser DevTools

---

## 🚀 **Quick Commands Reference**

### Deploy Frontend
```bash
cd frontend
vercel --prod
```

### Deploy Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Deploy Backend (Railway)
```bash
cd backend
railway up
```

### View Logs
```bash
# Vercel
vercel logs

# Railway
railway logs
```

### List Deployments
```bash
vercel ls
```

---

## 💡 **Pro Tips**

1. **Use Railway for Backend**: It's genuinely easier with included database
2. **Set up Git integration**: Auto-deploy on every push
   - In Vercel dashboard → Project → Settings → Git
   - Connect your GitHub repo
3. **Use Preview Deployments**: Every PR gets its own URL
4. **Monitor Usage**: Check Vercel dashboard for bandwidth/build minutes
5. **Custom Domain**: Add your own domain in Project Settings

---

## 📊 **Cost Summary**

| Service | Free Tier | What You Get |
|---------|-----------|--------------|
| **Vercel Frontend** | Free | 100 GB bandwidth, unlimited sites |
| **Vercel Backend** | Free | Serverless functions, need external DB |
| **Vercel Postgres** | $20/month | Hosted PostgreSQL |
| **Railway** | $5 free credit/month | Backend + PostgreSQL included |

**Recommended for Hackathon/Demo:**
- Frontend: Vercel (Free) ✅
- Backend: Railway (Free $5 credit) ✅
- **Total Cost: $0** for demo period!

---

## ✅ **Deployment Checklist**

### Frontend
- [ ] Environment variables set in Vercel dashboard
- [ ] Build succeeds
- [ ] Site loads correctly
- [ ] Wallet connection works
- [ ] Contract address configured

### Backend
- [ ] Database created (Railway or Vercel Postgres)
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Health endpoint returns "ok"
- [ ] CORS configured for frontend

### Integration
- [ ] Frontend has correct backend URL
- [ ] Backend has correct frontend URL
- [ ] API calls working
- [ ] Authentication working
- [ ] Contract interactions working

---

## 🔗 **Helpful Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Your Backend Deployment Guide](./backend/DEPLOYMENT.md)
- [Sepolia Deployment Guide](./SEPOLIA_DEPLOYMENT_GUIDE.md)

---

## 🎉 **Next Steps After Deployment**

1. **Test thoroughly**: Try all features on production
2. **Set up monitoring**: Use Vercel Analytics
3. **Enable Git integration**: Auto-deploy on push
4. **Add custom domain** (optional): Makes it more professional
5. **Share your demo**: Your app is now live!

---

Need help? Check the [main README](./README.md) or create an issue!

**Your Contract on Sepolia**: https://sepolia.etherscan.io/address/0xd91844e669a6138dc41fe1aEb0091822CC12f4d1

