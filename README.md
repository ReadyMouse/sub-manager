# Project Overview

SubChain is a decentralized subscription management protocol that brings familiar "set and forget" recurring payments to cryptocurrency. The platform solves a critical pain point in the crypto ecosystem: the inability to easily manage recurring payments.

**The Problem We're Solving:**
- Crypto users hold $150B+ in stablecoins but have no native way to manage subscriptions
- Subscriptions management ystems like Privacy.com with million of users is fiat-only
- Current solutions require locking funds in escrow (poor UX) or manual monthly payments (friction) or streaming micro-payments like Hyperliquid
- No unified dashboard exists to view all crypto-based subscriptions in one place
- Recurring tax-deductable charitable donations via crypto (with on-chain proof)
- Recurring peer-to-peer transcations (rent, allowance, savings accounts, etc.)

**Our Solution:**
SubChain enables users to create subscriptions using PYUSD (PayPal's stablecoin) through the ERC-20 allowance pattern to auto-off-ramp into PayPal. Money stays in the user's wallet until payment is due, preserving financial sovereignty while enabling the subscription economy. Chainlink Automation or Gelato Network monitors subscriptions and automatically triggers payments from PYUSD -> PayPal account when due. Truly "set and forget" recurring payments. An Envio-powered indexer tracks all subscription events to provide a unified dashboard where users manage their subscriptions, view payment history, and receive balance warnings. Leveraging Hardhat's capibility to fork mainnet ETH for development. 

**Target Audience:** Crypto-native users who hold PYUSD and want to pay for subscriptions (Netflix, Spotify, SaaS tools, etc.) without linking traditional bank accounts or credit cards.

## How It Works

### PayPal-Enabled Subscription Flow:
```
User's PYUSD Wallet
    ↓ (Smart Contract Approval)
House Coinbase PYUSD Account
    ↓ (Zero-fee conversion - API triggered)
House Coinbase USD Balance
    ↓ (Coinbase API → PayPal withdrawal)
House PayPal Business Account
    ↓ (PayPal Payouts API)
User's PayPal Account
    ↓ (User automatically pays subscription)
Subscription Renewed 
```

The system enables users to pay for any PayPal-accepting subscription using their PYUSD. No subscription data is stored on-chain - the smart contract only handles payment approvals and transfers.

### Digital Peer-to-Peer Option:
```
Renter's PYUSD
    ↓ 
Smart Contract
    ↓ 
Landlord's PYUSD 
    ↓ 
Rent gets paid 
```

### Off Shoot Flows
```
User's PYUSD Wallet
    ↓ 
Smart Contract 
    ↓       -> Recipient PYUSD Wallet  
House Coinbase PYUSD Account
    ↓       -> (Future) NEAR/DEX -> Recipient Wallet 
House Coinbase USD Balance
    ↓ 
House PayPal Business Account
    ↓       -> Recipient Paypal (Charity/Patreon) 
User's PayPal Account
    ↓ 
Subscription Renewed 
```
## Relevant Links 
* [Charities that Directly Accept PayPal](https://www.paypal.com/fundraiser/hub)



## 🚀 Quick Start

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
3. Run `npm test` to verify everything works

# SubChain Notes
## Platform Architecture

┌─────────────────────────────────────┐
│         SubChain Platform           │
│    (Your crypto-native core)        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Smart Contracts (PYUSD)      │  │
│  │ Envio Indexer (Dashboard)    │  │
│  │ Payment Processing           │  │
│  └──────────────────────────────┘  │
│                                     │
│         Integration Layer           │
│  ┌─────────┬─────────┬──────────┐  │
│  │ PayPal  │Coinbase │ Payment  │  │
│  │ Payouts │  APIs   │ Router   │  │
│  └─────────┴─────────┴──────────┘  │
└─────────────────────────────────────┘
              ↓
    ┌──────────────────────┐
    │  Any Service with    │
    │   PayPal Support     │
    │                      │
    └──────────────────────┘

## Market 

Privacy.com has proven people want unified subscription management—they have millions of users. But they're 100% fiat. We're building the crypto-native version for the 500M+ people holding stablecoins who want to pay with crypto instead of linking their bank account.

## Hardhat testing + Coverage 

Reults in `coverage.json`

October 12, 2025 : 1725
---------------------------|----------|----------|----------|----------|----------------|
File                       |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
---------------------------|----------|----------|----------|----------|----------------|
 contracts/                |      100 |    91.18 |      100 |      100 |                |
  Interfaces.sol           |      100 |      100 |      100 |      100 |                |
  SubChainSubscription.sol |      100 |    91.18 |      100 |      100 |                |
---------------------------|----------|----------|----------|----------|----------------|
All files                  |      100 |    91.18 |      100 |      100 |                |
---------------------------|----------|----------|----------|----------|----------------|


## Hackathon requirments
### Envio
Best Use of HyperIndex ⸺ $1,500
Awarded to the team that best demonstrates the creative use of HyperIndex, Envio’s high-performance, multichain indexing framework. We will look for clear schema design, optimized event handling, and meaningful data querying. 

Qualification Requirements:

- Deployment to the hosted service (please reachout if you need production resources)
- Clear usage in your application

### Hardhat ⸺ $2,500

Usage of a Hardhat release 3.0.0*. Usage of Hardhat 2 releases won't qualify.

### Paypal

🥇 Grand Prize (Best Overall Transformative Use of PYUSD) ⸺ $4,500
Awarded to the project that most convincingly demonstrates a powerful and scalable real-world use case for PYUSD. The winner will set a new benchmark for digital payments, showing how PYUSD unlocks unique value—whether by powering global remittances, revolutionizing commerce, or creating new economic opportunities. 

OR 

🎖️ PYUSD Consumer Champion (Best Consumer-Focused Payments Experience) ⸺ $3,500
This prize recognizes the project  that builds the most seamless and engaging consumer payment experience with PYUSD at its core. From streamlining cross-border settlements, to enabling microtransactions, **programmable subscriptions**, or “pay-as-you-go” economics, we want to see fresh ideas that push the boundaries of what’s possible in digital payments. Think outside the box—your solution should inspire new thinking for the entire PYUSD ecosystem.

NOTE

Each Project Submission will be judged by a panel of judges in accordance with the following criteria: 
(a) Functionality: How well does this Project Submission work? What is the quality of the code? 
(b) Payments Applicability: How effectively does the solution address real-world payment challenges? 
(c) Novelty: How unique is this Project Submission’s concept? 
(d) UX: How well does this Project Submission utilize PYUSD’s performance and unique proposition to create great UX for downstream users? 
(e) Open-source: Is this Project Submission open-source? How well does the Project Submission compose with other primitives in the ecosystem? 
(f) Business Plan: Is there a viable business that can be built in the future around this Submission? 

Qualification Requirements

1. Submission must clearly demonstrate utilization of PYUSD (deployed on mainnet or testnet)
2. Project must be newly built and deployed.
3. Include a public code repo; if private, share access credentials
4. Submit a 2–4 minute demo video explaining and showcasing the project
5. Project must be original

## Note

Cursor + Claude AI was used to support development. 

## Future Considerations:

- Gas fee optimization for PYUSD transactions
- Multi-chain support for broader accessibility
- Enhanced subscription analytics and reporting
- Advanced payment routing optimization

## Regulatory Compliance Roadmap

**Current Status:** Prototype/Demo Only

**Production Requirements:**
1. Money Transmitter Licenses (via partner or direct)
2. AML/KYC compliance program
3. FinCEN MSB registration
4. State-specific crypto licenses where applicable

**Go-to-Market Strategy:**
- Phase 1: Partner with Stripe Treasury/Coinbase Commerce
- Phase 2: Obtain MTLs in top 10 states
- Phase 3: Nationwide expansion

⚠️ PROTOTYPE DEMONSTRATION
This is a proof-of-concept for educational purposes only.
Not operational. No real financial services provided.
Production launch subject to regulatory approval.
