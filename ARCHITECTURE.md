# StableRent Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          StableRent Architecture                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │◄────────┤   Backend    │◄────────┤   Envio      │
│  (React +    │  REST   │  (Express +  │ Webhook │  (Indexer)   │
│   Wagmi)     │   API   │   Prisma)    │         │              │
└──────┬───────┘         └──────┬───────┘         └──────▲───────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         │
┌──────────────┐         ┌──────────────┐         ┌──────┴───────┐
│  Smart       │         │  PostgreSQL  │         │  Ethereum    │
│  Contract    │─────────┤   Database   │         │  Mainnet     │
│  (Hardhat)   │  Events │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Key Components

### 1. Frontend (React + TypeScript + Wagmi)
- User interface
- Wallet connection (MetaMask, WalletConnect)
- Smart contract interactions
- API calls to backend

### 2. Backend (Express + TypeScript + Prisma)
- **Purpose**: User management and subscription metadata
- **Why?** Smart contract cannot store emails, profile info, or complex metadata
- **Features**:
  - Email/password authentication (for users without wallets)
  - User profiles and preferences
  - Subscription metadata (notes, tags, categories)
  - Payment addresses management
  - Notifications

### 3. Smart Contract (Solidity + Hardhat)
- **Purpose**: Subscription logic and payment processing
- **Storage**: Minimal on-chain data (addresses, amounts, timestamps)
- **References**: User IDs link to off-chain database

### 4. Envio (Blockchain Indexer)
- **Purpose**: Index blockchain events and sync to backend
- **Features**:
  - Real-time event indexing
  - GraphQL API for frontend
  - Webhooks to backend

### 5. PostgreSQL Database
- User accounts and profiles
- Subscription metadata
- Payment history (synced from blockchain)
- Notifications


