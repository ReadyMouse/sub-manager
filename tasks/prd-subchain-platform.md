# Product Requirements Document: SubChain - Universal Crypto Subscription Manager

## 1. Introduction/Overview

SubChain is a decentralized subscription management protocol that brings familiar "set and forget" recurring payments to cryptocurrency. The platform solves a critical pain point in the crypto ecosystem: the inability to easily manage recurring payments.

**The Problem We're Solving:**
- Crypto users hold $150B+ in stablecoins but have no native way to manage subscriptions
- Subscriptions management ystems like Privacy.com with million of users is fiat-only
- Current solutions require locking funds in escrow (poor UX) or manual monthly payments (friction) or streaming micro-payments like Hyperliquid
- On-chain payment history is fully public, exposing sensitive subscription data
- No unified dashboard exists to view all crypto-based subscriptions in one place
- Recurring tax-deductable charitable donations via crypto (with on-chain proof)
- Recurring peer-to-peer transcations (rent, allowance, savings accounts, etc.)

**Our Solution:**
SubChain enables users to create subscriptions using PYUSD (PayPal's stablecoin) through the ERC-20 allowance pattern to auto-off-ramp into PayPal. Money stays in the user's wallet until payment is due, preserving financial sovereignty while enabling the subscription economy. Chainlink Automation or Gelato Network monitors subscriptions and automatically triggers payments from PYUSD → PayPal account when due. Truly "set and forget" recurring payments. An Envio-powered indexer tracks all subscription events to provide a unified dashboard where users manage their subscriptions, view payment history, and receive balance warnings. Leveraging Hardhat's capability to fork mainnet ETH for development.

**The Flow:**
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
Subscription Renewed ✅
```
AND 
```
Renter's PYUSD
    ↓ 
Smart Contract
    ↓ 
Landlord's PYUSD 
    ↓ 
Rent gets paid ✅
```

AND

```
User's PYUSD Wallet
    ↓ (Smart Contract Approval)
House Coinbase PYUSD Account
    ↓ (Zero-fee conversion - API triggered)
House Coinbase USD Balance
    ↓ (Coinbase API → PayPal withdrawal)
House PayPal Business Account
    ↓ (PayPal Payouts API)
Recipient's PayPal Account
    ↓ 
Patreon Supported ✅
```

**Key Innovation:** The system enables users to pay for ANY PayPal-accepting subscription using their PYUSD. No subscription data is stored on-chain - the smart contract only handles payment approvals and transfers.

**Target Audience:** Crypto-native users who hold PYUSD and want to pay for subscriptions (Netflix, Spotify, SaaS tools, etc.) without linking traditional bank accounts or credit cards.

## 2. Goals

1. **Enable PYUSD to PayPal Bridge:** Allow users to use PYUSD for any PayPal-accepting subscription service
2. **Automate Payment Processing:** Use Chainlink Automation or Gelato Network to automatically trigger payments when due (true "set and forget")
3. **Seamless Off-Ramping:** Automatic PYUSD → USD → PayPal conversion via Coinbase and PayPal APIs
4. **Universal Subscription Support:** Works with ANY service that accepts PayPal (Netflix, Spotify, gyms, SaaS, etc.)
5. **Maintain User Financial Control:** Never lock user funds, payments pulled only when due
6. **Provide Unified Dashboard:** Give users a single place to view, manage, and monitor all crypto-based subscriptions
7. **Support Peer-to-Peer Payments:** Maintain direct PYUSD transfer option for rent, allowances, etc.
8. **Win PYUSD Consumer Champion Prize:** Demonstrate the most seamless consumer payment experience with programmable subscriptions
9. **Win Envio Indexing:** Demonstrate leveraging HyperIndex for real-time subscription tracking and event monitoring
10. **Win Hardhat 3:** Demonstrate using Hardhat's capability to fork mainnet ETH for development

## 3. User Stories

### Primary User: End Consumer (PYUSD Holder)

**US-1: Creating a Subscription with PayPal**
> As a crypto user holding PYUSD, I want to subscribe to Netflix using my stablecoin balance that automatically converts to PayPal, so that I can pay for services without linking my bank account or credit card.

**Acceptance Criteria:**
- User can connect wallet (MetaMask/WalletConnect)
- User can link their PayPal account (one-time setup)
- User can browse marketplace showing any PayPal-accepting subscription
- User can see subscription details (price in PYUSD, billing interval, service name)
- User can approve PYUSD allowance for SubChain contract
- User can create subscription with one transaction
- Transaction is indexed within 5 seconds
- Subscription appears in dashboard immediately
- System stores encrypted PayPal account info for automated payouts

**US-2: Viewing Subscription Dashboard**
> As a user with multiple active subscriptions, I want to see all my subscriptions in one dashboard, so that I can track my recurring expenses and upcoming payments.

**Acceptance Criteria:**
- Dashboard displays all active subscriptions with service names, amounts, and next payment dates
- Dashboard shows total monthly/annual subscription spend
- Dashboard displays payment history (successful, failed, pending)
- Dashboard provides balance warnings if wallet has insufficient PYUSD for upcoming payments
- Dashboard updates in real-time when events occur

**US-3: Processing Recurring Payments via PayPal**
> As a subscriber, I want my subscription payments to process automatically each billing cycle with PYUSD converting to PayPal, so that I don't have to manually send payments each month.

**Acceptance Criteria:**
- When payment is due, automation triggers `processPayment()` on smart contract
- Contract verifies payment is due based on billing interval
- Contract checks user has sufficient PYUSD balance and allowance
- Contract transfers exact subscription amount from user wallet to house account
- Backend service receives payment event and initiates conversion flow:
  - PYUSD converted to USD via Coinbase API (zero fees)
  - USD transferred to house PayPal business account
  - PayPal Payouts API sends funds to user's linked PayPal account
- Payment event is indexed and appears in dashboard
- Next payment date is automatically calculated and updated
- User's PayPal receives funds to pay their subscription

**US-4: Canceling a Subscription**
> As a user, I want to cancel my subscription at any time, so that I maintain control over my recurring expenses.

**Acceptance Criteria:**
- User can cancel subscription from dashboard with one click
- Cancellation transaction is processed on-chain
- No further payments can be processed after cancellation
- Subscription status updates to "Cancelled" in dashboard
- Payment history remains visible after cancellation

**US-5: Handling Failed Payments**
> As a user who runs out of PYUSD balance, I want the system to handle payment failures gracefully, so that I understand why payments failed and what happens next.

**Acceptance Criteria:**
- If payment fails (insufficient balance/allowance), failure is logged on-chain
- Failed payment appears in dashboard with reason
- After 3 consecutive payment failures, subscription auto-cancels
- User receives notification (dashboard indicator) before auto-cancellation
- Service provider is notified of payment failure

**US-6: PayPal Account Linking**
> As a user, I want to securely link my PayPal account once, so that all my subscriptions can automatically receive funds without repeated setup.

**Acceptance Criteria:**
- User can link PayPal account through secure OAuth flow or email input
- System stores encrypted PayPal account details associated with wallet address
- User can view linked PayPal status in dashboard
- User can update or unlink PayPal account at any time
- System validates PayPal account is active before processing first payment

## 4. Functional Requirements

### Smart Contract Requirements (Hardhat 3.x)

**FR-1:** The smart contract MUST be developed using Hardhat version 3.0.0 or higher.

**FR-2:** The contract MUST define a `Subscription` struct containing:
- `subscriber` (address): User's wallet address
- `serviceProviderID` (uint256): Service provider's ID
- `amount` (uint256): Payment amount in PYUSD (wei units)
- `interval` (uint256): Billing interval in seconds (e.g., 30 days = 2592000)
- `nextPaymentDue` (uint256): Timestamp when next payment is due
- `isActive` (bool): Whether subscription is currently active
- `failedPaymentCount` (uint8): Number of consecutive failed payments
- `createdAt` (uint256): Subscription creation timestamp
- `serviceName` (string): Human-readable service name (e.g., "Netflix Premium", "Alchemy Pro")
- `paymentType` (uint8): Integration method (0 = Direct Crypto, 1 = Paypal)
- `endDate` (datetime): End date for the subscription
- `maxPayments` (int): Maximum number of payments to approve

**FR-3:** The contract MUST implement a `createSubscription()` function that:
- Accepts parameters: serviceProvider ID, amount, interval, endDate (optional), maxPayments (optional)
- Requires user has approved sufficient PYUSD allowance
- Creates new subscription with `nextPaymentDue` set to current timestamp + interval
- Assigns unique subscription ID
- Emits `SubscriptionCreated` event
- Returns subscription ID
- Note: Subscription metadata (service name, PayPal details) stored off-chain in backend

**FR-4:** The contract MUST implement a `processPayment()` function that:
- Accepts subscription ID as parameter
- Can be called by automation bot or service provider
- Verifies subscription is active
- Verifies current timestamp >= nextPaymentDue
- Checks user has sufficient PYUSD balance
- Checks user has sufficient PYUSD allowance
- Transfers PYUSD from user to house account (for PayPal conversion) or directly to provider (for P2P)
- Increments `paymentCount` on successful payment
- Updates `nextPaymentDue` to current value + interval
- Checks if subscription should expire (endDate reached or maxPayments reached)
- Resets `failedPaymentCount` to 0 on successful payment
- Emits `PaymentProcessed` event with amount, timestamp, subscription ID
- If payment fails, increments `failedPaymentCount`
- If `failedPaymentCount` reaches 3, sets `isActive` to false and emits `SubscriptionCancelled` event

**FR-5:** The contract MUST implement a `cancelSubscription()` function that:
- Accepts subscription ID as parameter
- Can only be called by the subscriber (original creator)
- Sets `isActive` to false
- Emits `SubscriptionCancelled` event with subscription ID, timestamp, reason ("user_cancelled")

**FR-6:** The contract MUST implement view functions:
- `getSubscription(uint256 subscriptionId)`: Returns full subscription details
- `getUserSubscriptions(address user)`: Returns array of subscription IDs for user
- `getActiveSubscriptions(address user)`: Returns only active subscription IDs
- `isPaymentDue(uint256 subscriptionId)`: Returns boolean if payment can be processed

**FR-7:** The contract MUST use PYUSD token contract (mainnet or testnet deployment) via ERC-20 interface

**FR-8:** The contract MUST emit the following events:
- `SubscriptionCreated(uint256 indexed subscriptionId, address indexed subscriber, address indexed serviceProvider, uint256 amount, uint256 interval, string serviceName, uint8 paymentType, uint256 timestamp)`
- `PaymentProcessed(uint256 indexed subscriptionId, address indexed subscriber, address indexed serviceProvider, uint256 amount, uint256 timestamp, uint256 nextPaymentDue)`
- `PaymentFailed(uint256 indexed subscriptionId, address indexed subscriber, uint256 amount, uint256 timestamp, string reason, uint8 failedCount)`
- `SubscriptionCancelled(uint256 indexed subscriptionId, address indexed subscriber, uint256 timestamp, string reason)`

### Envio Indexer Requirements

**FR-9:** The indexer MUST be deployed to Envio's hosted service

**FR-10:** The indexer MUST define a clear schema (in `schema.graphql`) for:
- `Subscription` entity with all fields from smart contract struct (including `paymentType` for frontend display)
- `Payment` entity tracking individual payment transactions
- `User` entity aggregating user subscription data
- `ServiceProvider` entity tracking providers (ID, wallet address, name, payment types supported)

**FR-11:** The indexer MUST handle the following events:
- `SubscriptionCreated`: Create new Subscription entity
- `PaymentProcessed`: Create Payment entity, update Subscription nextPaymentDue
- `PaymentFailed`: Create Payment entity (marked as failed), update Subscription failedPaymentCount
- `SubscriptionCancelled`: Update Subscription isActive status

**FR-12:** The indexer MUST support GraphQL queries for:
- Get all subscriptions for a user address
- Get payment history for a subscription
- Get active subscriptions with upcoming payments in next 7 days
- Calculate total monthly subscription cost per user
- Get all failed payments for a user

**FR-13:** The indexer MUST update in real-time (events processed within 5 seconds of on-chain confirmation)

### Dashboard/Frontend Requirements

**FR-14:** The dashboard MUST allow users to connect their wallet via:
- MetaMask
- WalletConnect (for mobile wallet support) (reach goal)

**FR-15:** The dashboard MUST display a subscription marketplace showing:
- Popular PayPal-accepting services as examples:
  - **Netflix** - $15.49/month (paid via PayPal)
  - **Spotify** - $10.99/month (paid via PayPal)
  - **Any service that accepts PayPal** - emphasize universal compatibility
- Service logo, name, and description
- Subscription price in PYUSD (with USD equivalent)
- Billing interval (monthly, annual, etc.)
- Payment method badge: "PayPal-Enabled" for marketplace items, "Direct PYUSD" for P2P
- Clear explanation: "Works with ANY service that accepts PayPal"

**FR-16:** The dashboard MUST provide a "My Subscriptions" page displaying:
- Grid/list of active subscriptions with: service name, amount, billing interval, next payment date
- Status indicator (Active, Cancelled, Failed)
- Total monthly/annual subscription cost (calculated sum)
- Action buttons: "View Details", "Cancel Subscription"

**FR-17:** The dashboard MUST provide a "Payment History" page displaying:
- Table of all payments (successful and failed)
- Columns: Date, Service, Amount, Status, Transaction Hash (link to block explorer)
- Filter by date range, status, service
- Reach goal: Export functionality (CSV) for user records

**FR-18:** The dashboard MUST display balance warnings:
- Alert icon if wallet PYUSD balance is insufficient for next payment
- Warning banner if any payment is overdue
- List of upcoming payments in next 7 days with total required balance

**FR-19:** The dashboard MUST provide subscription creation flow:
- Select service from marketplace or enter custom subscription
- Link PayPal account if not already linked (one-time setup)
- Review subscription details (PYUSD amount, interval, total per year)
- Approve PYUSD allowance (separate transaction)
- Create subscription (transaction)
- Show loading states during transaction confirmation
- Show success confirmation with subscription details

### PayPal Integration Backend Requirements

**FR-20:** The system MUST implement a backend payment processing service that:
- Listens to smart contract `PaymentProcessed` events via webhook or polling
- Receives PYUSD payment notifications with subscription ID, amount, user wallet address
- Looks up user's linked PayPal account from encrypted database
- Initiates PYUSD to USD conversion via Coinbase API (zero fees)
- Transfers USD to house PayPal business account
- Sends payout to user's PayPal account via PayPal Payouts API
- Logs full transaction trail: PYUSD amount, USD amount, PayPal payout ID, timestamps
- Handles errors and retries gracefully (network failures, API timeouts, insufficient balance)
- Sends status updates back to frontend for dashboard display

**FR-21:** The backend MUST implement secure PayPal account management:
- API endpoint for users to link PayPal account (via OAuth or email input)
- Store PayPal account details encrypted in database, associated with wallet address
- Validate PayPal accounts are active before accepting subscription creation
- Allow users to update or remove PayPal account
- Support multiple wallet addresses per PayPal account (optional)

**FR-22:** The backend MUST implement Coinbase API integration:
- Connect to Coinbase Commerce or Coinbase Exchange API
- Convert received PYUSD to USD at market rate (should be 1:1 with minimal slippage)
- Handle conversion via zero-fee or low-fee method
- Track conversion rates and amounts for transparency
- Handle API rate limits and failures

**FR-23:** The system MAY support direct peer-to-peer PYUSD payments:
- For user-created providers (landlord, allowance recipient), route payments directly wallet-to-wallet
- No PayPal conversion needed for these subscriptions
- Smart contract transfers PYUSD directly to provider's wallet address
- Dashboard displays "Direct PYUSD Payment" badge for P2P subscriptions

### Automation Requirements (Chainlink or Gelato)

**FR-24:** The system MUST implement automated payment processing using either Chainlink Automation or Gelato Network:
- Configure automation service to monitor subscription contract
- Implement upkeep/task that checks for due payments and triggers `processPayment()`
- Automation should run at regular intervals (e.g., every hour or daily)
- Handle gas costs for automation (service provider or protocol covers gas)
- Log automation activity for monitoring and debugging

### Testing Requirements (Hardhat)

**FR-25:** The project MUST include comprehensive Hardhat tests covering:
- Subscription creation with valid/invalid parameters
- Payment processing for due/not-due subscriptions
- Failed payment handling and auto-cancellation after 3 failures
- Subscription cancellation by user
- Edge cases: insufficient balance, insufficient allowance, non-existent subscription
- Event emission verification

**FR-26:** Tests MUST use Hardhat mainnet fork to test with actual PYUSD contract

**FR-27:** Tests MUST achieve >80% code coverage

## 5. Non-Goals (Out of Scope)

The following features are explicitly **out of scope** for this version:

**NG-1:** **On-Chain Subscription Metadata** - Subscription details (service names, PayPal accounts) are NOT stored on-chain. Only payment approvals and basic subscription parameters are on-chain. Metadata is stored off-chain in the backend.

**NG-2:** **Multiple Coin Support** - Only PYUSD is supported.

**NG-3:** **Mobile Native Apps** - Web-only interface. No iOS or Android native applications.

**NG-4:** **Gift Card Integration** - No Bitrefill or gift card API integration. PayPal Payouts handle all subscription payments.

**NG-5:** **Multi-Chain Support** - Deployment on single chain only (Ethereum mainnet or testnet), no multi-chain indexing.

**NG-6:** **Service Provider Onboarding Portal** - No self-service portal for service providers. Marketplace shows example services for demonstration.

**NG-7:** **Notifications/Alerts** - No email, SMS, or push notifications. Dashboard-only indicators for warnings and status updates.

**NG-8:** **Direct Fiat On-Ramps** - Users must acquire PYUSD through external exchanges. PayPal off-ramping is handled by the backend.

## 6. Design Considerations

### UI/UX Requirements

**DC-1: Modern, Consumer-Focused Design**
- Clean, minimal interface inspired by Privacy.com and modern fintech apps
- Use PayPal brand colors where appropriate (PYUSD branding)
- Mobile-responsive design (web-based, but works on mobile browsers)

**DC-2: Dashboard Layout**
- Left sidebar navigation: Marketplace, My Subscriptions, Payment History, Settings
- Main content area with appropriate page content
- Top bar: Wallet connection status, PayPal connection status, PYUSD balance

**DC-3: Subscription Cards**
- Visual card design for each subscription showing:
  - Service logo (use placeholder or actual logos if available)
  - Service name and plan
  - Price in PYUSD
  - Next payment date
  - Status badge (Active/Cancelled/Payment Failed)

**DC-4: Loading States**
- Show skeleton loaders while fetching data from indexer
- Transaction pending states with spinner
- Success/error toast notifications

**DC-5: Wallet and PayPal Connection**
- Prominent "Connect Wallet" button if not connected
- Modal with MetaMask for wallet connection
- "Link PayPal" button for PayPal account setup
- Show connected wallet address, PYUSD balance, and PayPal status in top bar
- Clear indicators when both wallet and PayPal are connected

### Component Suggestions

- React with TypeScript for type safety
- Wagmi or Web3Modal for wallet connection
- Apollo Client or similar for GraphQL queries (Envio)
- Tailwind CSS or shadcn/ui for styling
- Recharts or similar for payment history charts/graphs

## 7. Technical Considerations

### Smart Contract Architecture

**TC-1:** Use OpenZeppelin contracts for security:
- Import `IERC20.sol` for PYUSD interface
- Consider `ReentrancyGuard` for payment processing function
- Use `Ownable` if admin functions are needed (e.g., updating contract parameters)

**TC-2:** Storage optimization:
- Use mappings for O(1) subscription lookups
- Consider using `uint32` for timestamps if gas optimization needed (valid until year 2106)
- Pack struct variables efficiently to minimize storage slots

**TC-3:** PYUSD Contract Addresses:
- Ethereum Mainnet: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- Sepolia Testnet: (use appropriate testnet address or deploy mock for testing)

### Envio Indexer Architecture

**TC-4:** Schema Design:
- Use relationships between entities (User hasMany Subscriptions, Subscription hasMany Payments)
- Index fields that will be queried frequently (user address, subscription status, payment timestamp)
- Derived fields for calculated values (totalMonthlySpend, nextPaymentDue)

**TC-5:** Event Handling:
- Implement handler functions for each event type
- Handle edge cases (e.g., multiple PaymentFailed events for same subscription)
- Ensure idempotency (replaying events doesn't corrupt data)

**TC-6:** Performance:
- Use Envio's multichain capabilities (even if single-chain now, architecture supports future expansion)
- Optimize queries with proper indexing in schema
- Consider pagination for payment history queries

### Backend Payment Processing Architecture

**TC-7:** Backend Service Requirements:
- **Technology Stack:** Node.js/Express backend service
- **Event Monitoring:** Listen to smart contract events via Alchemy webhooks or polling
- **Database:** PostgreSQL or MongoDB for storing PayPal account mappings (encrypted)
- **API Integrations:** Coinbase APIs, PayPal Payouts API
- **Security:** Encrypt PayPal account details at rest, use secure API key management
- **Deployment:** Railway, Render, or AWS for cloud hosting

**TC-8:** Payment Processing Flow:
1. Backend receives `PaymentProcessed` event from smart contract
2. Lookup user's PayPal account from database using wallet address
3. Call Coinbase API to convert PYUSD to USD (1:1 expected, zero fees)
4. Transfer USD to house PayPal business account via Coinbase withdrawal
5. Call PayPal Payouts API to send funds to user's PayPal
6. Log transaction: PYUSD amount, USD amount, conversion rate, PayPal payout ID, timestamps
7. Update database with payment status
8. Emit status update to frontend via GraphQL subscription or polling

**TC-9:** Error Handling and Retries:
- Implement exponential backoff for API failures
- Store failed transactions in queue for manual review
- Send alerts for persistent failures (>3 retries)
- Maintain audit log of all payment processing attempts
- Handle edge cases: insufficient balance, closed PayPal accounts, API rate limits

### Automation Architecture

**TC-10:** Chainlink Automation vs Gelato Selection Criteria:
- **Chainlink Automation:**
  - More decentralized keeper network
  - Requires LINK token for upkeep funding
  - Better for production/mainnet deployments
  - Compatible with Chainlink-compatible contracts (implement `checkUpkeep` and `performUpkeep`)
- **Gelato Network:**
  - Simpler setup, supports payment in ETH or other tokens
  - Good developer experience with Web3 Functions
  - May be easier for hackathon demo
  - Can use Automate SDK for quick integration

**TC-11:** Keeper Contract Implementation:
- Implement view function `getPaymentsDue()` that returns array of subscription IDs ready for processing
- Optimize gas by limiting batch size (e.g., max 10 subscriptions per upkeep call)
- Use efficient loops and early returns to minimize gas in `checkUpkeep`
- Consider implementing time-based batching (process oldest due payments first)

**TC-12:** Automation Monitoring:
- Track automation upkeep balance to ensure continuous operation
- Set up alerts for low balance or failed upkeeps
- Log all automated payment attempts for debugging
- Consider fallback manual trigger if automation fails

### Deployment Strategy

**TC-13:** Smart Contract Deployment:
- Deploy to Ethereum Sepolia testnet first for testing
- Deploy to Ethereum mainnet for production demo
- Use Hardhat Ignition modules for deployment automation
- Verify contract on Etherscan

**TC-14:** Backend Service Deployment:
- Deploy payment processing backend to cloud provider (Railway, Render, AWS)
- Configure environment variables for Coinbase and PayPal APIs
- Set up database for PayPal account storage (encrypted)
- Configure webhook listeners for smart contract events
- Test full PYUSD → PayPal flow on testnet

**TC-15:** Envio Indexer Deployment:
- Deploy to Envio hosted service
- Configure event sources to point to deployed contract address
- Test queries via Envio GraphQL playground

**TC-16:** Automation Service Deployment:
- Register upkeep with Chainlink Automation or create Gelato task
- Fund upkeep with LINK (Chainlink) or ETH (Gelato)
- Test automation triggers on testnet before mainnet
- Monitor automation dashboard for successful executions

**TC-17:** Frontend Deployment:
- Deploy to Vercel/Netlify for hackathon demo
- Configure environment variables for production (contract addresses, backend API, PayPal config)

## 8. Success Metrics

### Technical Metrics

**SM-1: Payment Processing Success Rate**
- Target: >99% of payment transactions succeed when user has sufficient balance/allowance
- Measure: (Successful payments / Total payment attempts) over time

**SM-2: Indexer Performance**
- Target: Events indexed within 5 seconds of on-chain confirmation
- Measure: Average time between block confirmation and event appearing in GraphQL queries

**SM-3: Smart Contract Gas Efficiency**
- Target: createSubscription() < 150,000 gas, processPayment() < 100,000 gas
- Measure: Average gas used per function call in tests

**SM-4: Test Coverage**
- Target: >80% code coverage on smart contracts
- Measure: Hardhat coverage report

**SM-5: Automation Reliability**
- Target: >95% of due payments processed automatically without manual intervention
- Measure: (Automated payments / Total due payments) tracked via Envio indexer

**SM-6: Automation Latency**
- Target: Payments processed within 1 hour of becoming due
- Measure: Time between `nextPaymentDue` timestamp and actual `PaymentProcessed` event

**SM-7: PayPal Integration Success Rate**
- Target: >95% of PYUSD payments successfully converted and sent to PayPal
- Measure: (Successful PayPal payouts / Total PaymentProcessed events) tracked in backend logs

### UX Metrics (For Demo/Judging)

**SM-8: Subscription Creation Flow Time**
- Target: User can create subscription in <60 seconds (including wallet and PayPal linking)
- Measure: Time from clicking "Subscribe" to subscription appearing in dashboard

**SM-9: Dashboard Load Time**
- Target: Dashboard displays subscriptions within 2 seconds of page load
- Measure: Time to first meaningful paint with subscription data

**SM-10: Demo Comprehension**
- Target: Judges understand the PYUSD → PayPal value proposition within 4-minute demo
- Measure: Qualitative feedback, ability to explain "works with ANY PayPal subscription" clearly

**SM-11: UX Polish**
- Target: Zero broken UI states, all loading states handled, error messages are clear
- Measure: Manual QA checklist, demo rehearsal feedback

### Business/Hackathon Metrics

**SM-12: Prize Alignment Score**
- Target: Clearly demonstrate "most seamless consumer payment experience" for PYUSD Consumer Champion prize by enabling ANY PayPal subscription
- Measure: Demo script emphasizes: programmable subscriptions, set-and-forget UX, financial sovereignty (funds stay in wallet), unified dashboard, automated payments via Chainlink/Gelato

**SM-13: Code Quality & Open Source**
- Target: Well-documented, clean code suitable for open-source release
- Measure: README completeness, code comments, TypeScript types, deployment instructions, architecture documentation

## 9. Open Questions

**OQ-1:** Should subscription amounts be fixed, or should we support variable pricing (e.g., usage-based subscriptions)?
- **For MVP:** Fixed amounts only. Variable pricing adds complexity.

**OQ-2:** What happens if a service provider's wallet address is compromised? Can subscriptions be paused/migrated?
- **For MVP:** No migration mechanism. User must cancel and recreate subscription. Consider adding "pause" function in v2.

**OQ-3:** Should there be a limit on maximum subscription amount or interval to prevent user error?
- **Suggested:** Add reasonable limits (e.g., max amount: 10,000 PYUSD, max interval: 1 year, min interval: 1 day)

**OQ-4:** How do we handle PYUSD price volatility (if any)? Should subscriptions be denominated in USD with PYUSD conversion?
- **For MVP:** Subscriptions are fixed PYUSD amounts. Since PYUSD is a stablecoin (~$1), volatility should be minimal.

**OQ-5:** For gift card flow, who pays for the gift card purchase fee (if Bitrefill charges one)?
- **Suggested:** Either: (a) User pays subscription amount + fee, or (b) Service provider absorbs fee. Document this in subscription creation flow.

**OQ-6:** Should the contract support multiple subscriptions to the same service by the same user?
- **For MVP:** Yes, allow multiple subscriptions (e.g., user might have Netflix Premium and Netflix Basic for different family members).

**OQ-7:** What blockchain should we deploy on for the hackathon demo?
- **Suggested:** Ethereum Sepolia testnet for testing, then Ethereum mainnet for final demo (since PYUSD is on Ethereum mainnet).

**OQ-8:** How do we handle gas fees for payment processing? Who pays?
- **For MVP:** Whoever calls `processPayment()` pays gas (service provider or automation bot). This is a cost of doing business for service providers. Document this clearly.

**OQ-9:** Should we implement client-side encryption for subscription metadata (privacy stretch goal)?
- **Decision:** Defer to stretch goal. If time permits after core features, implement basic client-side encryption of service names using user-derived password.

**OQ-10:** Should we use Chainlink Automation or Gelato Network for payment automation?
- **Chainlink Automation Pros:** More decentralized, battle-tested, better for production
- **Gelato Network Pros:** Simpler integration, supports ETH for gas, good developer UX
- **Suggested:** Start with Gelato for faster hackathon development. Can migrate to Chainlink post-hackathon if needed. Both support testnet deployment.

---

## Implementation Priority (For Development)

**Timeline:** 16 days  
**Strategy:** Build minimum viable demo first (Days 1-10), then add integrations and polish (Days 11-16)

### Phase 1: Core Smart Contract (Days 1-3)
**Goal:** Working subscription contract deployed to testnet
1. Set up Hardhat 3.x project with TypeScript and mainnet fork
2. Implement `SubChainSubscription.sol` contract (FR-2 through FR-8)
   - Basic struct with `paymentType` field
   - `createSubscription()`, `processPayment()`, `cancelSubscription()` functions
   - Events for all actions
3. Write essential Hardhat tests (FR-23 to FR-25)
   - Happy path: create, process payment, cancel
   - Failed payment handling
   - Test on forked mainnet with real PYUSD
4. Deploy to Sepolia testnet, verify on Etherscan

**Milestone:** ✅ You can create and process subscriptions on-chain

### Phase 2: Envio Indexer (Days 4-6)
**Goal:** Real-time subscription data queryable via GraphQL
1. Define GraphQL schema (FR-10) - Subscription, Payment, User entities
2. Configure Envio indexer to listen to Sepolia contract
3. Implement event handlers (FR-11) for all 4 events
4. Set up GraphQL queries (FR-12) - get user subscriptions, payment history
5. Deploy to Envio hosted service (FR-9)
6. Test queries in Envio playground (FR-13) 

**Milestone:** ✅ Dashboard can query live subscription data

### Phase 3: Minimal Dashboard (Days 7-10)
**Goal:** Users can create and view subscriptions
1. Set up React + TypeScript + Tailwind project (use Vite for speed)
2. Implement MetaMask wallet connection (FR-14)
3. Build **simplified** marketplace (FR-15)
   - Start with 1-2 hardcoded services (Alchemy = Direct, Netflix = Gift Card)
   - Show service name, price, payment type badge
4. Build subscription creation flow (FR-19)
   - Approve PYUSD allowance → Create subscription
   - Loading states, success confirmation
5. Build "My Subscriptions" page (FR-16, FR-18)
   - List active subscriptions from Envio
   - Show next payment date, balance warnings
   - Cancel button
6. Integrate with Envio GraphQL API
7. Deploy to Vercel

**Milestone:** ✅ End-to-end demo works (create subscription → view in dashboard)

### Phase 4: Payment Processing & Automation (Days 11-12)
**Goal:** Show automated payment works via Chainlink/Gelato
1. **Choose automation provider** (Chainlink Automation or Gelato - pick one)
2. **Implement keeper functions in contract:**
   - Add `getPaymentsDue()` view function to return subscription IDs ready for payment
   - If Chainlink: Implement `checkUpkeep()` and `performUpkeep()` functions
   - If Gelato: Create Web3 Function or use Automate SDK
3. **Deploy and configure automation:**
   - Register upkeep/task with chosen provider
   - Fund with LINK (Chainlink) or ETH (Gelato)
   - Test automation triggers on testnet
4. **Frontend integration:**
   - Add payment history view (FR-17) - show successful/failed payments
   - Display automation status indicator (e.g., "Automated via Chainlink")
5. **Test scenarios:**
   - Verify automation calls `processPayment()` when due
   - Test failure scenarios (insufficient balance → auto-cancel after 3 failures)
   - Monitor automation dashboard

**Milestone:** ✅ Can demonstrate fully automated recurring payments (no manual intervention needed)

### Phase 5: Vendor Integrations (Days 13-14)
**Goal:** Show 2-3 different payment types working
1. **Direct Crypto (FR-20)** - Already works! Just need service provider wallet addresses
2. **Gift Card Integration (FR-21)** - Optional based on time:
   - If time: Integrate Bitrefill API for Netflix
   - If no time: Mock it (show UI flow, simulate gift card code)
3. **Manual Entry (FR-22)** - Show UI mockup of how it would work
4. Add payment type badges to subscription cards (Direct/Automated/Manual)
5. Add 1-2 more services to marketplace

**Milestone:** ✅ Demo shows flexibility of different payment types

### Phase 6: Polish & Demo (Days 15-16)
**Goal:** Polished submission ready
1. **Day 15: Final polish**
   - Deploy smart contract to Ethereum mainnet (or stay on Sepolia if gas is concern)
   - Point Envio indexer to mainnet contract
   - Update frontend to mainnet
   - Create 2-3 real subscriptions for demo
   - Fix any UI bugs, add loading states
   - Write clear README with setup instructions
2. **Day 16: Demo video & documentation**
   - Record 4-minute demo video showing:
     - Problem statement (30 sec)
     - Creating subscription (60 sec)
     - Dashboard overview (60 sec)
     - Payment processing (60 sec)
     - Different payment types (30 sec)
   - Write submission description highlighting PYUSD, Envio, Hardhat 3.x usage
   - Final testing
   - Submit!

**Milestone:** ✅ Hackathon submission complete

### Critical Path Items (Must Have)
- ✅ Smart contract with create/process/cancel functions
- ✅ Chainlink Automation or Gelato integration for automated payment processing
- ✅ Envio indexer tracking all events
- ✅ Dashboard to create and view subscriptions
- ✅ Demo showing at least 1 working subscription end-to-end (fully automated)
- ✅ Code deployed and publicly accessible
- ✅ 4-minute demo video

### Nice-to-Have (Cut if time runs short)
- Multiple vendor integrations (focus on 1 working integration is fine)
- Bitrefill API integration (can be mocked in UI)
- Advanced UI features (charts, export CSV)
- Manual payment method (describe in docs instead of building)
- Client-side encryption (definitely cut)

---

**Document Version:** 1.0  
**Created:** October 10, 2025  
**PRD AI Origin:** https://github.com/snarktank/ai-dev-tasks
**Target Completion:** 16 days (October 10 - October 26, 2025)  
**Target Prizes:** PYUSD Consumer Champion ($3,500), Envio HyperIndex ($1,500), Hardhat 3.x eligibility ($2,500)

