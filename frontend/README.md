# StableRent Frontend

Professional crypto rent payment platform using PayPal's PYUSD stablecoin for automated, transparent rent transactions.

## Features

- **Set Up Rent Payments**: Configure automated monthly rent payments to your landlord
- **Manage Payments**: Track active rent payment schedules
- **Payment History**: View complete transaction history
- **Wallet Integration**: MetaMask and WalletConnect support
- **Real-time Updates**: Envio indexer for instant data
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **Apollo Client** - GraphQL client for Envio
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+
- A web3 wallet (MetaMask)
- PYUSD on Sepolia testnet (or mainnet)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Update environment variables:
```env
VITE_CONTRACT_ADDRESS=<your_deployed_contract_address>
VITE_DEFAULT_CHAIN=sepolia
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_ENVIO_ENDPOINT=<your_envio_graphql_endpoint>
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx
│   ├── WalletConnect.tsx
│   ├── ServiceCard.tsx
│   ├── SubscriptionCard.tsx
│   ├── BalanceWarning.tsx
│   ├── Toast.tsx
│   ├── Skeleton.tsx
│   └── AutomationStatus.tsx
├── pages/           # Page components
│   ├── Home.tsx
│   ├── MySubscriptions.tsx
│   ├── PaymentHistory.tsx
│   ├── CreateSubscription.tsx
│   └── Settings.tsx
├── hooks/           # Custom React hooks
│   ├── useContract.ts
│   ├── useEnvio.ts
│   └── useToast.ts
├── lib/             # Configuration and utilities
│   ├── constants.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── abi.ts
│   ├── wagmi.ts
│   └── apollo.ts
├── App.tsx          # Main app with routing
└── main.tsx         # Entry point
```

## Key Features

### Wallet Connection
- Connect with MetaMask or WalletConnect
- Displays PYUSD balance
- Network detection

### Rent Payment Management
- Set up automated rent payments with flexible terms
- Direct wallet-to-wallet PYUSD transfers
- Set end dates or max payments
- Cancel anytime
- Real-time status updates

### Payment Flow
1. Renter approves PYUSD allowance
2. Creates rent payment schedule with landlord's wallet address
3. Automated payments via smart contract
4. Direct PYUSD transfer to landlord's wallet

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONTRACT_ADDRESS` | StableRent contract address | `0x123...` |
| `VITE_DEFAULT_CHAIN` | Default network | `sepolia` |
| `VITE_SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://eth-sepolia.g.alchemy.com/v2/...` |
| `VITE_ENVIO_ENDPOINT` | Envio GraphQL endpoint | `https://indexer.envio.dev/...` |
| `VITE_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID | `your_project_id` |

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

```bash
npm run build
vercel --prod
```

### Other Platforms

The app is a static site and can be deployed to:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- IPFS (for decentralized hosting)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
