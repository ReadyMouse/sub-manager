# Project Overview

Project Summary: **SubChain - Universal Crypto Subscription Manager**
SubChain is a decentralized subscription management protocol that brings 
familiar "set and forget" recurring payments to crypto. Users create 
subscriptions by approving the SubChain smart contract to spend **PYUSD** 
(PayPal's stablecoin) directly from their wallet using the ERC-20 allowance 
pattern—similar to giving a gym ACH authorization to auto-charge your bank 
account each month. When a subscription payment becomes due (based on the 
billing interval), the service provider or an automation bot calls the 
contract's ```processPayment()``` function, which pulls the exact subscription 
amount from the user's wallet and transfers it to the service provider. The 
smart contract tracks billing cycles, handles failed payments gracefully 
(auto-canceling after consecutive failures), and allows users to cancel anytime. **Envio** indexes all subscription events to power a unified dashboard where users see all their active subscriptions, upcoming payments, balance warnings, and payment history in one place. Built with **Hardhat** for development and testing, the platform solves crypto's recurring payment problem without requiring users to lock funds in escrow—money stays in their wallet until payment is due, preserving financial sovereignty while enabling the subscription economy.

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
## Rough Idea

┌─────────────────────────────────────┐
│         SubChain Platform           │
│    (Your crypto-native core)        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Smart Contracts (PYUSD)      │  │
│  │ Envio Indexer (Dashboard)    │  │
│  │ Encrypted Metadata (Privacy) │  │
│  └──────────────────────────────┘  │
│                                     │
│         Integration Layer           │
│  ┌─────────┬─────────┬──────────┐  │
│  │ Privacy │Bitrefill│ Coinbase │  │
│  │  .com   │   API   │ Commerce │  │
│  └─────────┴─────────┴──────────┘  │
└─────────────────────────────────────┘
              ↓
    ┌──────────────────────┐
    │  Any Service         │
    │  (Netflix, Spotify,  │
    │   Gyms, SaaS, etc.)  │
    └──────────────────────┘

## Hackathon Positioning
"Hi judges, I'm going to show you how crypto subscriptions 
should work...

[Opens SubChain.xyz]

Here's our marketplace - think Bitrefill meets Netflix. 
I can browse any subscription service...

[Clicks Netflix]

SubChain automatically determines the best way to pay:
- For Netflix: Gift card API (automated)
- For Dune Analytics: Direct integration (native)
- For anything else: Virtual card bridge (universal)

Watch me subscribe to Netflix with PYUSD...

[Approves PYUSD allowance]
[Creates subscription]

Instantly indexed by Envio...

[Dashboard updates in real-time]

Gift card purchased via Bitrefill...
[Show API response]

Now, my browser extension detects the gift card is ready...
[Extension icon lights up]

I click 'Auto-Redeem'...
[Puppeteer window pops up]

Watch it log in and redeem automatically...
[Shows browser automating the redemption]

Done! Netflix renewed without me doing anything.
[Shows Netflix account with updated balance]"


## Market 

Privacy.com has proven people want unified subscription management—they have millions of users. But they're 100% fiat. We're building the crypto-native version for the 500M+ people holding stablecoins who want to pay with PYUSD instead of linking their bank account.

## Integrations to Consider

* Unlock Protocol 
* Alchemy -> used for this project
* Mintstars -> showcase the privacy aspects with encrypted label
* Bitrefill/Coinsbee -> requires manual code entry

## Privacy-Preserving Subscriptions

Keep payments on-chain but encrypt subscription metadata

### The Problem
Traditional on-chain subscriptions expose:
❌ What services you use
❌ How much you spend
❌ Your entire subscription history

### Our Solution: Client-Side Encryption
✅ Subscription details encrypted before hitting blockchain
✅ Only you can decrypt with your password/key
✅ Blockchain only sees: amounts, timing, addresses
✅ No one can tell OnlyFans from Netflix from Spotify

### Privacy Guarantees
- Service names: PRIVATE
- Categories: PRIVATE  
- Payment amounts: PUBLIC (required for smart contract)
- Payment timing: PUBLIC (required for automation)

### Future: Full ZK Privacy
With more time, we'd implement zk-SNARKs to hide amounts too.
Technologies:

* Noir (Aztec's ZK language) - beginner-friendly
* Circom + SnarkJS - more established
* zk-SNARKs on EVM - native support on some chains

## Hackathon requirments
### Envio
Best Use of HyperIndex ⸺ $1,500
Awarded to the team that best demonstrates the creative use of HyperIndex, Envio’s high-performance, multichain indexing framework. We will look for clear schema design, optimized event handling, and meaningful data querying. 

Qualification Requirements:

- Deployment to the hosted service (please reachout if you need production resources)
- Clear usage in your application

### Hardhat

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
