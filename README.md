# Project Overview

StableRent is a tool for property owners and renters to use Stablecoin digital assets. Landlords can screen tenants by checking account balances of assets and accept Paypal's PYUSD, while renters can automatically send rent payments using stablecoins. 

**The Problem We're Solving:**
- The US residential rental market is $291 BILLION dollars
- Estimates for US-based crypto assets are around $90B
- Crypto users want to pay rent in crypto, but finding landlords who take crypto is hard 
- Recurring peer-to-peer transactions (rent, allowance, savings accounts, etc.)
- Many folks hear "crypto" and think scam, but Paypal is a reputable company that could ease adoption

**Discussion in the Industry**: https://www.linkedin.com/posts/shuhaib_crypto-rent-the-100-billion-shift-no-activity-7348397294506975232-thtY/

**Our Solution:**
StableRent enables users to create recurring rental payments using PYUSD (PayPal's stablecoin) through the ERC-20 allowance pattern to auto-off-ramp into the landlord's PayPal account. Landlords can easily withdraw their PYUSD into their fiat Paypal account, without understanding too much of the crypto world, facilitating greater adoption. Money stays in the renter's wallet until payment is due, preserving financial sovereignty. Chainlink Automation monitors rent due dates and automatically triggers payments from Renter's PYUSD -> Landlord's PYUSD PayPal account when due. The crypto ACH. Truly "set and forget" recurring payments. An Envio-powered indexer tracks all payment events to provide a unified dashboard where renters manage their rent payments, view payment history, and receive balance warnings. Landlords can see payment history, as well as run financial qualification searches to check renter's assets. This project will leverage Hardhat's capability to fork mainnet ETH for development. 

**Target Audience:** Crypto-native users who want to pay rent without off-ramping to traditional bank account.

**Simply:** Recurring direct peer-to-peer crypto payments: **Rent**, Charities, Patreon, child's allowance, etc 

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
Renter's PYUSD
    ↓ 
Smart Contract
    ↓ 
Landlord's PYUSD 
    ↓ 
Rent gets paid 
```
> Note going to try to get it working first with Renter paying gas, but gas-less transcations (paid by smart contract) may a be preferrable expansion model. 

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

# StableRent Notes
## Platform Architecture

TBD

## Hardhat testing + Coverage 

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

October 14, 2025: 1208
---------------------------|----------|----------|----------|----------|----------------|
File                       |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
---------------------------|----------|----------|----------|----------|----------------|
 contracts/                |      100 |    91.18 |      100 |      100 |                |
  Interfaces.sol           |      100 |      100 |      100 |      100 |                |
  SubChainSubscription.sol |      100 |    91.18 |      100 |      100 |                |
---------------------------|----------|----------|----------|----------|----------------|
All files                  |      100 |    91.18 |      100 |      100 |                |
---------------------------|----------|----------|----------|----------|----------------|

> Reports written to ./coverage/ and ./coverage.json


## Hackathon requirements
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
- Escrow for security deposits, and first/last month
- Lease documents stored on IFPS or Autonomys
- Multi-chain support for broader accessibility (renter holds ZEC -> DEX: NEAR Intents -> PYUSD -> Landlord)
- zkProof or encryption for privacy and security
- StablePay (peer-to-peer)
- StableDonate (Charity focused, recurring donations)
- Proxy pattern for upgradeable contracts

- Listing Resource: 
- - Renters willing to pay rent "I would pay X a month for a 3bed, 2 bath in (zipcode)"
- - Land owners will to rent "I will accept crypto for this rental"
- - For Sale Properties: renter can say "I'd pay X a month for 3 years, if someone bought this and rented it to me."

⚠️ PROTOTYPE DEMONSTRATION
This is a proof-of-concept for educational purposes only.
Not operational. No real financial services provided.
Production launch subject to regulatory approval.
