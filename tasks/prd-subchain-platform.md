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
SubChain enables users to create subscriptions using PYUSD (PayPal's stablecoin) through the ERC-20 allowance pattern—similar to giving a gym ACH authorization to auto-charge your bank account each month. Money stays in the user's wallet until payment is due, preserving financial sovereignty while enabling the subscription economy. Chainlink Automation or Gelato Network monitors subscriptions and automatically triggers payments when due—truly "set and forget" recurring payments. An Envio-powered indexer tracks all subscription events to provide a unified dashboard where users manage their subscriptions, view payment history, and receive balance warnings. Leveraging Hardhat's capibility to fork mainnet ETH for development. 

**Target Audience:** Crypto-native users who hold PYUSD and want to pay for subscriptions (Netflix, Spotify, SaaS tools, etc.) without linking traditional bank accounts or credit cards.

## 2. Goals

1. **Enable Recurring PYUSD Payments:** Allow users to approve one-time authorization for recurring subscription payments from their wallet
2. **Automate Payment Processing:** Use Chainlink Automation or Gelato Network to automatically trigger payments when due (true "set and forget")
3. **Support Multiple Payment Flows:** Handle both direct crypto-to-crypto subscriptions AND non-crypto subscitions (potentially with gift card redemption flows via Bitrefill)
4. **Provide Unified Dashboard:** Give users a single place to view, manage, and monitor all crypto-based subscriptions
5. **Maintain User Financial Control:** Never lock user funds, payments pulled only when due
6. **Win PYUSD Consumer Champion Prize:** Demonstrate the most seamless consumer payment experience with programmable subscriptions
7. **Win Envio Indexing:** Demostrate leveraging HyperIndex for real-time subscription tracking and event monitoring
8. **Win Hardhat 3:** Demostrate using Hardhat's capibility to fork mainnet ETH for development

## 3. User Stories

### Primary User: End Consumer (PYUSD Holder)

**US-1: Creating a Subscription**
> As a crypto user holding PYUSD, I want to subscribe to Netflix using my stablecoin balance, so that I can pay for services without linking my bank account or credit card.

**Acceptance Criteria:**
- User can connect wallet (MetaMask/WalletConnect)
- User can browse available services in marketplace
- User can see subscription details (price, billing interval, service name)
- User can approve PYUSD allowance for SubChain contract
- User can create subscription with one transaction
- Transaction is indexed within 5 seconds
- Subscription appears in dashboard immediately

**US-2: Viewing Subscription Dashboard**
> As a user with multiple active subscriptions, I want to see all my subscriptions in one dashboard, so that I can track my recurring expenses and upcoming payments.

**Acceptance Criteria:**
- Dashboard displays all active subscriptions with service names, amounts, and next payment dates
- Dashboard shows total monthly/annual subscription spend
- Dashboard displays payment history (successful, failed, pending)
- Dashboard provides balance warnings if wallet has insufficient PYUSD for upcoming payments
- Dashboard updates in real-time when events occur

**US-3: Processing Recurring Payments**
> As a subscriber, I want my subscription payments to process automatically each billing cycle, so that I don't have to manually send payments each month.

**Acceptance Criteria:**
- When payment is due, authorized party (service provider or bot) can call `processPayment()`
- Contract verifies payment is due based on billing interval
- Contract checks user has sufficient PYUSD balance and allowance
- Contract transfers exact subscription amount from user wallet to service provider
- Payment event is indexed and appears in dashboard
- Next payment date is automatically calculated and updated

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

**US-6: Gift Card Automation (Netflix, Spotify, etc.)**
> As a user subscribing to traditional services like Netflix, I want SubChain to automatically purchase and redeem gift cards, so that I can use PYUSD for services that don't accept crypto directly.

**Acceptance Criteria:**
- When payment processes for gift card-based subscription, system calls Bitrefill API
- Gift card is purchased with PYUSD equivalent amount
- Gift card code is stored securely and associated with subscription
- User can view gift card codes in dashboard
- (Stretch Goal: Browser extension auto-redeems gift card via automation)

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
- `paymentType` (uint8): Integration method (0 = Direct Crypto, 1 = Automated Gift Card, 2 = Manual Entry)

**FR-3:** The contract MUST implement a `createSubscription()` function that:
- Accepts parameters: serviceProvider ID, amount, interval, serviceName, paymentType
- Requires user has approved sufficient PYUSD allowance
- Creates new subscription with `nextPaymentDue` set to current timestamp + interval
- Assigns unique subscription ID
- Emits `SubscriptionCreated` event
- Returns subscription ID

**FR-4:** The contract MUST implement a `processPayment()` function that:
- Accepts subscription ID as parameter
- Can be called by service provider OR any automation bot
- Verifies subscription is active
- Verifies current timestamp >= nextPaymentDue
- Checks user has sufficient PYUSD balance
- Checks user has sufficient PYUSD allowance
- Checks what type of payment methods, and executes payment based on service provider type
- Updates `nextPaymentDue` to current value + interval
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
- Available services with clear payment type indicators:
  - **Alchemy** (Direct Crypto Payment) - accepts PYUSD natively
  - **Mintstars** (Direct Crypto Payment) - accepts PYUSD natively
  - **Netflix** (Automated Gift Card) - via Bitrefill API
  - Additional services as time allows
- Service logo, name, and description
- Subscription price in PYUSD (with USD equivalent)
- Billing interval (monthly, annual, etc.)
- Payment method badge: "Direct Crypto" / "Automated Gift Card" / "Manual Entry Required" / "Other"
- Brief explanation of how payment works for each service type

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
- Select service from marketplace
- Review subscription details (amount, interval, total per year)
- Approve PYUSD allowance (separate transaction)
- Create subscription (transaction)
- Show loading states during transaction confirmation
- Show success confirmation with subscription details

### As Many Subscription Integrations As Time Allows (ex. Bitrefill API)

**FR-20:** The system MAY support crypto-native direct payment integrations:
- For services that accept PYUSD directly (e.g., Alchemy, Mintstars), route payments straight to service provider wallet
- Payment processing flow: User approves allowance → SubChain contract transfers PYUSD to service provider on payment date
- Service provider receives full subscription amount (no intermediary fees or conversions)
- Dashboard displays "Direct Crypto Payment" badge for these subscriptions
- Service receives webhook/notification when payment is processed (optional integration)

**FR-21:** The system MAY support automated gift card purchases via Bitrefill (or similar APIs):
- For services available on Bitrefill (e.g., Netflix, Spotify), automatically purchase gift cards when subscription payment processes
- Payment flow: PYUSD transfers to service provider wallet → Backend calls Bitrefill API → Gift card purchased → Code stored in database
- Store gift card codes securely associated with subscription ID and payment ID
- Dashboard displays "Automated Gift Card" badge for these subscriptions
- Display purchased gift card codes in dashboard with: date, amount, code (revealed on click), redemption status
- Provide "Copy Code" button for easy manual redemption
- Handle API failures gracefully: log error, notify user, but don't fail the PYUSD payment

**FR-22:** The system MAY provide universal payment method for non-crypto services (Privacy.com approach):
- For any service not directly integrated, provide "Manual Payment Card" option
- When subscription payment processes, PYUSD transfers to DEX like NEAR Intents then fills a refillable generic credit card
- System generates/displays payment fulfillment information for user to manually enter into service
  - Virtual payment details (virtual card number/CVV for manual entry)
- Dashboard shows clear instructions
- This method works universally for ANY service (most flexible, requires fiat off-ramping, and external card service)
- Dashboard displays "Manual Entry Required" badge for these subscriptions

### Automation Requirements (Chainlink or Gelato)

**FR-23:** The system MUST implement automated payment processing using either Chainlink Automation or Gelato Network:
- Configure automation service to monitor subscription contract
- Implement upkeep/task that checks for due payments and triggers `processPayment()`
- Automation should run at regular intervals (e.g., every hour or daily)
- Handle gas costs for automation (service provider or protocol covers gas)
- Log automation activity for monitoring and debugging

### Testing Requirements (Hardhat)

**FR-26:** The project MUST include comprehensive Hardhat tests covering:
- Subscription creation with valid/invalid parameters
- Payment processing for due/not-due subscriptions
- Failed payment handling and auto-cancellation after 3 failures
- Subscription cancellation by user
- Edge cases: insufficient balance, insufficient allowance, non-existent subscription
- Event emission verification

**FR-27:** Tests MUST use Hardhat mainnet fork to test with actual PYUSD contract

**FR-28:** Tests MUST achieve >80% code coverage

## 5. Non-Goals (Out of Scope)

The following features are explicitly **out of scope** for this version:

**NG-1:** **ZK-SNARKs/Full Privacy Features** - While the README mentions client-side encryption and future ZK privacy, full privacy implementation (encrypted metadata, zero-knowledge proofs) is deferred to future versions. MVP subscriptions will have public on-chain data.

**NG-2:** **Multiple Coin Support** - Only PYUSD is supported.

**NG-3:** **Mobile Native Apps** - Web-only interface. No iOS or Android native applications.

**NG-4:** **Browser Extension for Auto-Redemption** - Automated gift card redemption via Puppeteer/browser automation is a stretch goal, not required for MVP.

**NG-5:** **Multi-Chain Support** - Deployment on single chain only (Ethereum mainnet or testnet), no multi-chain indexing.

**NG-6:** **Service Provider Onboarding Portal** - No self-service portal for service providers to register. Services are hardcoded in marketplace for MVP.

**NG-7:** **Notifications/Alerts** - No email, SMS, or push notifications. Dashboard-only indicators for warnings and status updates.

**NG-8:** **Fiat On/Off Ramps** - No integration with fiat payment processors. Users must acquire PYUSD through external means.

## 6. Design Considerations

### UI/UX Requirements

**DC-1: Modern, Consumer-Focused Design**
- Clean, minimal interface inspired by Privacy.com and modern fintech apps
- Use PayPal brand colors where appropriate (PYUSD branding)
- Mobile-responsive design (web-based, but works on mobile browsers)

**DC-2: Dashboard Layout**
- Left sidebar navigation: Marketplace, My Subscriptions, Payment History, Settings
- Main content area with appropriate page content
- Top bar: Wallet connection status, PYUSD balane

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

**DC-5: Wallet Connection**
- Prominent "Connect Wallet" button if not connected
- Modal with MetaMask
- Show connected address and balance after connection

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

### Automation Architecture

**TC-7:** Chainlink Automation vs Gelato Selection Criteria:
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

**TC-8:** Keeper Contract Implementation:
- Implement view function `getPaymentsDue()` that returns array of subscription IDs ready for processing
- Optimize gas by limiting batch size (e.g., max 10 subscriptions per upkeep call)
- Use efficient loops and early returns to minimize gas in `checkUpkeep`
- Consider implementing time-based batching (process oldest due payments first)

**TC-9:** Automation Monitoring:
- Track automation upkeep balance to ensure continuous operation
- Set up alerts for low balance or failed upkeeps
- Log all automated payment attempts for debugging
- Consider fallback manual trigger if automation fails

### Deployment Strategy

**TC-10:** Smart Contract Deployment:
- Deploy to Ethereum Sepolia testnet first for testing
- Deploy to Ethereum mainnet for production demo
- Use Hardhat Ignition modules for deployment automation
- Verify contract on Etherscan

**TC-11:** Envio Indexer Deployment:
- Deploy to Envio hosted service
- Configure event sources to point to deployed contract address
- Test queries via Envio GraphQL playground

**TC-12:** Automation Service Deployment:
- Register upkeep with Chainlink Automation or create Gelato task
- Fund upkeep with LINK (Chainlink) or ETH (Gelato)
- Test automation triggers on testnet before mainnet
- Monitor automation dashboard for successful executions

**TC-13:** Frontend Deployment:
- Deploy to Vercel/Netlify for hackathon demo
- Configure environment variables for production

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

### UX Metrics (For Demo/Judging)

**SM-7: Subscription Creation Flow Time**
- Target: User can create subscription in <60 seconds (including wallet approvals)
- Measure: Time from clicking "Subscribe" to subscription appearing in dashboard

**SM-8: Dashboard Load Time**
- Target: Dashboard displays subscriptions within 2 seconds of page load
- Measure: Time to first meaningful paint with subscription data

**SM-9: Demo Comprehension**
- Target: Judges understand the value proposition within 4-minute demo
- Measure: Qualitative feedback, ability to explain use case clearly

**SM-10: UX Polish**
- Target: Zero broken UI states, all loading states handled, error messages are clear
- Measure: Manual QA checklist, demo rehearsal feedback

### Business/Hackathon Metrics

**SM-11: Prize Alignment Score**
- Target: Clearly demonstrate "most seamless consumer payment experience" for PYUSD Consumer Champion prize
- Measure: Demo script emphasizes: programmable subscriptions, set-and-forget UX, financial sovereignty (funds stay in wallet), unified dashboard, automated payments via Chainlink/Gelato

**SM-12: Code Quality & Open Source**
- Target: Well-documented, clean code suitable for open-source release
- Measure: README completeness, code comments, TypeScript types, deployment instructions

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

