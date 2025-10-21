# StableRent Overview

StableRent is a tool for property owners and residents to use Stablecoin digital assets. Property owners can screen tenants by checking account balances of assets and accept Paypal's PYUSD, while residents can automatically send rent payments using stablecoins. 

**🚀 LIVE DEMO:** https://stablerent.vercel.app/

**The Problem We're Solving:**
- The US residential rental market is $291 BILLION dollars
- Estimates for US-based crypto assets are around $90B
- Many folks hear "crypto" and think scam, but Paypal is a reputable company that could ease adoption
- Crypto users want to pay rent in crypto, but finding property owners who take crypto is hard 
- Recurring peer-to-peer transactions (rent, allowance, savings accounts, etc.)

**Discussion in the Industry**: https://www.linkedin.com/posts/shuhaib_crypto-rent-the-100-billion-shift-no-activity-7348397294506975232-thtY/

**Our Solution:**
StableRent enables users to create recurring rental payments using PYUSD (PayPal's stablecoin) through the ERC-20 allowance pattern to auto-off-ramp into the landlord's PayPal account. Landlords can easily withdraw their PYUSD into their fiat Paypal account, without understanding too much of the crypto world, facilitating greater adoption. Money stays in the renter's wallet until payment is due, preserving financial sovereignty. Gelato Network automation monitors rent due dates and automatically triggers payments from Renter's PYUSD -> Landlord's PYUSD PayPal account when due. The crypto ACH. Truly "set and forget" recurring payments. An Envio-powered indexer tracks all payment events to provide a unified dashboard where renters manage their rent payments, view payment history, and receive balance warnings. Landlords can see payment history, as well as run financial qualification searches to check renter's assets. This project will leverage Hardhat's capability to fork mainnet ETH for development. 

**Target Audience:** Crypto-native users who want to pay rent without off-ramping to a traditional bank account.

**Simply:** Recurring direct peer-to-peer crypto payments: **Rent**, Charities, Patreon, child's allowance, etc 

![Overview of StableRent](./frontend/src/assets/ov1_pp.png)

## Hackathon Relevance 
**Why PayPal**: This isn't just catering to PayPal's bounty, PYUSD is actually a good choice for this project: 
- Reputation of PayPal as good company will encourage adoption among crypto-skeptical users
- PYUSD Stablecoin tied to the USD so landlord don't take on volatility risk
- PayPal is an accepted payment source for many other services
- PayPal provides an easy PYUSD to USD off-ramp built into the app for landlords who need USD

**Why Envio**: 
- Rapid multi-chain indexing of renter's addresses to get account balances (on-demand of landlord)
- Tools for tracking subscriptions and on-chain events without centralized database tracking, or slow block parsing

**Why Hardhat**:
- The forking of mainnet ETH is invaluable for testing indexing of account balances
- The simulated blockchain is game-changer for rapid development without faucets or testnets

## How It Works

PYUSD native Peer-to-Peer:
```
Resident's PYUSD
    ↓ 
Smart Contract
    ↓ 
Property Owner's PYUSD 
    ↓ 
Rent gets paid 
```

## 🚀 Current Deployment Status
### Sepolia Contract Deployment
**🔗 Subscription Smart Contract:** [0xd91844e669a6138dc41fe1aEb0091822CC12f4d1](https://sepolia.etherscan.io/address/0xd91844e669a6138dc41fe1aEb0091822CC12f4d1)  

**🔗 Gelato Executor Smart Contract:** [0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68](https://sepolia.etherscan.io/address/0x2Eb1FEAd84eEa8C8FB31E80f98aD74c65aD60c68)

**🔗 Gelato Resolver Smart Contract:** [0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36](https://sepolia.etherscan.io/address/0x0Fafb218e162C5Af464D86dCC43De4FBaFC4eA36)

### Frontend Demo
**Frontend:** [StableRent](https://stablerent.vercel.app/)

### Database
**Supabase** 

### 🔄 **In Progress**
- **Backend API:** Setting up Vercel + Supabase (free database)
- **Full Integration:** Connecting frontend ↔ backend ↔ database

### 🎯 **How to Test**
1. Visit the live demo URL above
2. Connect MetaMask wallet (Sepolia network)
3. Get test PYUSD from [faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia/pyusd)
4. Create subscription and test payments

---

## 🚀 Quick Start
### First Time Setup

Run the automated setup script to install dependencies and configure your environment:

```bash
./setup.sh
```

The script will:
- ✓ Check Node.js version (requires LTS: 22.x, 20.x, or 18.x)
- ✓ Create `.env` file (you'll need to add your Alchemy API key)
- ✓ Install all Hardhat and project dependencies
- ✓ Compile contracts
- ✓ Verify setup

**After running setup.sh:**
1. Get free Alchemy API key from https://www.alchemy.com/
2. Add it to your `.env` file
3. Run `npx hardhat test` to verify everything works

### Local Development (Testing Frontend + Backend + Contracts)

**One command to rule them all:**

```bash
./launch.sh
# Options available: frontend, backend, etc.
```

### Sepolia Testnet Deployment (For Hackathon Demo)

Deploying ht main subscription service contract:

```bash
# Quick deployment
npm run deploy:sepolia
```
Deploying the gelato automation contracts:

```bash
npm run deploy:gelato:sepolia
```

📚 **Complete deployment guide**: [SEPOLIA_DEPLOYMENT_GUIDE.md](./SEPOLIA_DEPLOYMENT_GUIDE.md)  

# StableRent Notes
## Platform Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StableRent System                        │
└─────────────────────────────────────────────────────────────┘

Frontend (React)                Backend (Express)
     │                               │
     ├─ Create Subscriptions         ├─ User Management
     ├─ Approve PYUSD                ├─ Payment Addresses
     ├─ View Dashboard               └─ Notifications
     │
     └────────────┬──────────────────────┐
                  ↓                      ↓
         Smart Contracts          Gelato Network
         ├─ StableRent           ├─ Resolver (checks)
         │  Subscription         └─ Executor (processes)
         └─ PYUSD Token               │
                  │                   │
                  └───────┬───────────┘
                          ↓
                   Envio Indexer
                          ↓
                   Backend + Frontend
                   (Event tracking)
```

### Automation with Gelato Network

StableRent uses **Gelato Network** for decentralized payment automation:
- **Gelato Resolver** checks which subscriptions are due (every 5-15 minutes)
- **Gelato Executor** processes payments automatically when due
- No centralized server needed - fully decentralized
- Users pay gas via Gelato's 1Balance prepaid system

📚 **Learn more**: See `gelato-automation/README.md` for complete documentation

## Note

Cursor + Claude AI was used to support development. 


## Future Considerations:
- Escrow for security deposits, and first/last month
- Lease documents stored on IFPS or Autonomys
- Multi-chain support for broader accessibility (renter holds ZEC -> DEX: NEAR Intents -> PYUSD -> Landlord)
- zkProof or encryption for privacy and security
- StablePay (peer-to-peer)
- StableDonate (Charity focused, recurring donations)
- Proxy pattern for upgradeable contracts
- KYC for transcations over gov reporting limits ($3-5k in single)
- Limits on the allowance approval (is there a regulation limit? what's reasonable?)
- More flexible scheduling options (every 3 weeks, first and fifteenth, etc)
- Internal encrypted messaging system. (Propoerty owner requests of resident to see account balances, resident can approve this requests)
- Gas optimizations on contract (>$100 to sign the allowance, switch to Base, Arbitrium, Polygon)
- PayPal database search (ask for Username -> wallet address)
- Signing transcation also needs to be first month (not just a sign) ETH handling

- Listing Resource: 
  - Renters willing to pay rent "I would pay X a month for a 3bed, 2 bath in (zipcode)"
  - Land owners will to rent "I will accept crypto for this rental"
  - For Sale Properties: renter can say "I'd pay X a month for 3 years, if someone bought this and rented it to me."

## Business Plan 

How to take this to market? What investments on PayPal's part would be nice?
Talk to a lawyer, what regulations come into play? 


⚠️ PROTOTYPE DEMONSTRATION
This is a proof-of-concept for educational purposes only.
Not operational. No real financial services provided.
Production launch subject to regulatory approval.
