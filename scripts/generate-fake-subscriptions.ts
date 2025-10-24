#!/usr/bin/env tsx

/**
 * ============================================================
 * FAKE SUBSCRIPTION DATA GENERATOR
 * ============================================================
 * 
 * PURPOSE:
 * Generates realistic fake subscription data in the local database
 * for testing the Envio indexer and frontend without touching production
 * 
 * HOW TO RUN:
 * npx tsx scripts/generate-fake-subscriptions.ts
 * 
 * WHAT IT DOES:
 * 1. Creates fake users (senders and recipients)
 * 2. Creates fake connected wallets
 * 3. Creates fake payment addresses
 * 4. Creates fake subscriptions with realistic data
 * 5. Creates fake payment history
 * 6. Outputs data for back-propagation to blockchain
 */

import { PrismaClient } from '../backend/node_modules/@prisma/client';
import { ethers } from 'ethers';

// Initialize Prisma client
const prisma = new PrismaClient();

// Fake data configuration
const FAKE_DATA_CONFIG = {
  // Number of fake users to create
  userCount: 10,
  
  // Number of fake subscriptions to create
  subscriptionCount: 25,
  
  // Number of fake payments per subscription
  paymentsPerSubscription: { min: 1, max: 5 },
  
  // Service names for realistic subscriptions
  serviceNames: [
    'Netflix Premium',
    'Spotify Family',
    'Adobe Creative Cloud',
    'Microsoft 365',
    'AWS Cloud Services',
    'GitHub Pro',
    'Figma Professional',
    'Notion Pro',
    'Slack Business',
    'Zoom Pro',
    'Dropbox Plus',
    'Canva Pro',
    'Grammarly Premium',
    'LastPass Premium',
    '1Password Family',
    'NordVPN',
    'ExpressVPN',
    'YouTube Premium',
    'Disney+',
    'HBO Max',
    'Apple Music',
    'Google One',
    'iCloud+',
    'Tesla Supercharging',
    'Uber Pass'
  ],
  
  // Realistic payment amounts (in PYUSD)
  paymentAmounts: [
    { min: 5, max: 15 },   // $5-15 for streaming services
    { min: 10, max: 30 },  // $10-30 for software subscriptions
    { min: 20, max: 100 }, // $20-100 for business services
    { min: 50, max: 500 }  // $50-500 for enterprise services
  ],
  
  // Billing intervals (in seconds)
  intervals: [
    30 * 24 * 60 * 60,    // 30 days
    7 * 24 * 60 * 60,     // 7 days (weekly)
    24 * 60 * 60,         // 1 day (daily)
    90 * 24 * 60 * 60,    // 90 days (quarterly)
    365 * 24 * 60 * 60    // 365 days (yearly)
  ]
};

// Helper function to convert PYUSD to base units (6 decimals)
function toBaseUnits(amount: number): string {
  return (amount * 1_000_000).toString();
}

// Helper function to generate realistic wallet addresses
function generateWalletAddress(): string {
  return ethers.Wallet.createRandom().address;
}

// Helper function to get random array element
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number between min and max
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random float between min and max
function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

// Helper function to generate fake email with timestamp to ensure uniqueness
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['example.com', 'test.com', 'demo.com', 'fake.com'];
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${random}@${randomElement(domains)}`;
}

// Helper function to generate fake name
function generateName(): { firstName: string; lastName: string; fullName: string } {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const firstName = randomElement(firstNames);
  const lastName = randomElement(lastNames);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

// Helper function to generate fake phone number
function generatePhoneNumber(): string {
  return `+1${randomNumber(200, 999)}${randomNumber(100, 999)}${randomNumber(1000, 9999)}`;
}

// Helper function to generate fake date in the past
function generatePastDate(yearsAgo: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * yearsAgo * 365 * 24 * 60 * 60 * 1000);
  return pastDate;
}

// Helper function to generate fake recent date
function generateRecentDate(daysAgo: number): Date {
  const now = new Date();
  const recentDate = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return recentDate;
}

// Helper function to generate fake future date
function generateFutureDate(yearsAhead: number): Date {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * yearsAhead * 365 * 24 * 60 * 60 * 1000);
  return futureDate;
}

// Helper function to get random service name
function getRandomServiceName(): string {
  return randomElement(FAKE_DATA_CONFIG.serviceNames);
}

// Helper function to get random payment amount
function getRandomPaymentAmount(): { amount: string; category: string } {
  const category = randomElement(['streaming', 'software', 'business', 'enterprise']);
  
  let amountRange;
  switch (category) {
    case 'streaming':
      amountRange = FAKE_DATA_CONFIG.paymentAmounts[0];
      break;
    case 'software':
      amountRange = FAKE_DATA_CONFIG.paymentAmounts[1];
      break;
    case 'business':
      amountRange = FAKE_DATA_CONFIG.paymentAmounts[2];
      break;
    case 'enterprise':
      amountRange = FAKE_DATA_CONFIG.paymentAmounts[3];
      break;
    default:
      amountRange = FAKE_DATA_CONFIG.paymentAmounts[1];
  }
  
  const amount = randomFloat(amountRange.min, amountRange.max, 2);
  
  return {
    amount: toBaseUnits(amount),
    category
  };
}

// Helper function to get random interval
function getRandomInterval(): number {
  return randomElement(FAKE_DATA_CONFIG.intervals);
}

// Helper function to calculate next payment due
function calculateNextPaymentDue(interval: number, paymentsCount: number = 0): Date {
  const now = new Date();
  const intervalMs = interval * 1000;
  const nextDue = new Date(now.getTime() + (intervalMs * (paymentsCount + 1)));
  return nextDue;
}

async function generateFakeUsers() {
  console.log('👥 Creating fake users...');
  
  const users = [];
  
  for (let i = 0; i < FAKE_DATA_CONFIG.userCount; i++) {
    const name = generateName();
    
    const user = await prisma.user.create({
      data: {
        displayName: name.fullName,
        firstName: name.firstName,
        lastName: name.lastName,
        email: generateEmail(name.firstName, name.lastName),
        phoneNumber: generatePhoneNumber(),
        userType: 'REGULAR',
        isVerified: Math.random() > 0.2, // 80% chance
        verificationLevel: randomElement(['BASIC', 'PHONE', 'IDENTITY']),
        isActive: true,
        createdAt: generatePastDate(2),
        lastLoginAt: generateRecentDate(30)
      }
    });
    
    users.push(user);
    console.log(`   ✅ Created user: ${user.displayName} (${user.email})`);
  }
  
  return users;
}

async function generateFakeWallets(users: any[]) {
  console.log('🔗 Creating fake connected wallets...');
  
  const wallets = [];
  
  for (const user of users) {
    // 70% chance of having a connected wallet
    if (Math.random() < 0.7) {
      const randomSignature = Array.from({length: 132}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      const randomMessage = Array.from({length: 32}, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      
      const wallet = await prisma.connectedWallet.create({
        data: {
          userId: user.id,
          walletAddress: generateWalletAddress(),
          label: randomElement(['MetaMask', 'Hardware Wallet', 'Coinbase Wallet', 'Trust Wallet']),
          currencyTicker: 'PYUSD',
          isVerified: true,
          verificationSignature: randomSignature,
          verificationMessage: `Sign this message to verify wallet ownership: ${randomMessage}`,
          verifiedAt: generatePastDate(1),
          isPrimary: true,
          isActive: true,
          connectedAt: generatePastDate(1),
          lastUsedAt: generateRecentDate(7)
        }
      });
      
      wallets.push(wallet);
      console.log(`   ✅ Created wallet: ${wallet.walletAddress} for ${user.displayName}`);
    }
  }
  
  return wallets;
}

async function generateFakePaymentAddresses(users: any[]) {
  console.log('💳 Creating fake payment addresses...');
  
  const addresses = [];
  
  for (const user of users) {
    // 60% chance of having a payment address
    if (Math.random() < 0.6) {
      const address = await prisma.paymentAddress.create({
        data: {
          userId: user.id,
          address: generateWalletAddress(),
          currency: 'PYUSD',
          label: randomElement(['Main Wallet', 'Business Wallet', 'Personal Wallet', 'Trading Wallet']),
          addressType: randomElement(['WALLET', 'CUSTODIAL', 'EXCHANGE']),
          isVerified: true,
          verifiedAt: generatePastDate(1),
          isDefault: true,
          isActive: true,
          createdAt: generatePastDate(1)
        }
      });
      
      addresses.push(address);
      console.log(`   ✅ Created payment address: ${address.address} for ${user.displayName}`);
    }
  }
  
  return addresses;
}

async function generateFakeSubscriptions(users: any[], wallets: any[], addresses: any[]) {
  console.log('📋 Creating fake subscriptions...');
  
  const subscriptions = [];
  
  for (let i = 0; i < FAKE_DATA_CONFIG.subscriptionCount; i++) {
    // Pick random sender and recipient
    const sender = randomElement(users);
    const recipient = randomElement(users.filter(u => u.id !== sender.id));
    
    // Get sender wallet
    const senderWallet = wallets.find(w => w.userId === sender.id);
    if (!senderWallet) continue;
    
    // Get recipient payment address
    const recipientAddress = addresses.find(a => a.userId === recipient.id);
    if (!recipientAddress) continue;
    
    // Generate subscription data
    const serviceName = getRandomServiceName();
    const paymentData = getRandomPaymentAmount();
    const interval = getRandomInterval();
    const nextPaymentDue = calculateNextPaymentDue(interval);
    
    // Generate realistic dates
    const createdAt = generatePastDate(1);
    const endDate = Math.random() < 0.3 
      ? generateFutureDate(2)
      : null;
    
    const maxPayments = Math.random() < 0.2
      ? randomNumber(3, 12)
      : null;
    
    // Calculate processor fee (0.5% to 2%)
    const processorFeePercent = randomFloat(0.005, 0.02, 4);
    const processorFee = Math.floor(parseInt(paymentData.amount) * processorFeePercent);
    
    const subscription = await prisma.subscription.create({
      data: {
        id: `31337:${i + 1}`, // Local chain ID + subscription ID
        chainId: 31337,
        onChainId: (i + 1).toString(),
        
        // Sender info
        senderId: sender.id,
        senderConnectedWalletId: senderWallet.id,
        senderWalletAddress: senderWallet.walletAddress,
        senderCurrency: 'PYUSD',
        
        // Recipient info
        recipientId: recipient.id,
        recipientPaymentAddressId: recipientAddress.id,
        recipientWalletAddress: recipientAddress.address,
        recipientCurrency: 'PYUSD',
        
        // Service info
        serviceName,
        serviceDescription: `Monthly subscription for ${serviceName}`,
        
        // Payment details
        amount: paymentData.amount,
        interval,
        nextPaymentDue,
        endDate,
        maxPayments,
        paymentCount: 0,
        failedPaymentCount: 0,
        isActive: true,
        
        // Processor fee
        processorFee: processorFee.toString(),
        processorFeeAddress: generateWalletAddress(),
        processorFeeCurrency: 'PYUSD',
        processorFeeID: randomNumber(1, 10).toString(),
        
        // Metadata
        notes: Math.random() < 0.3 ? `Auto-renewal subscription for ${serviceName}` : null,
        tags: randomElement([
          ['business'], 
          ['personal'], 
          ['entertainment'], 
          ['productivity'], 
          ['security'],
          ['business', 'productivity'],
          ['personal', 'entertainment']
        ]),
        
        // Sync status
        lastSyncedAt: new Date(),
        syncStatus: 'SYNCED',
        
        createdAt,
        updatedAt: new Date()
      }
    });
    
    subscriptions.push(subscription);
    console.log(`   ✅ Created subscription: ${serviceName} (${subscription.id}) - $${(parseInt(paymentData.amount) / 1_000_000).toFixed(2)} PYUSD`);
  }
  
  return subscriptions;
}

// Helper to generate random alphanumeric string
function generateAlphanumeric(length: number): string {
  const chars = '0123456789abcdef';
  return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Helper to generate date between two dates
function generateDateBetween(from: Date, to: Date): Date {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  const randomTime = fromTime + Math.random() * (toTime - fromTime);
  return new Date(randomTime);
}

async function generateFakePayments(subscriptions: any[]) {
  console.log('💰 Creating fake payment history...');
  
  const payments = [];
  
  for (const subscription of subscriptions) {
    const paymentCount = randomNumber(
      FAKE_DATA_CONFIG.paymentsPerSubscription.min, 
      FAKE_DATA_CONFIG.paymentsPerSubscription.max 
    );
    
    for (let i = 0; i < paymentCount; i++) {
      const paymentDate = generateDateBetween(subscription.createdAt, new Date());
      
      const processorFee = Math.floor(parseInt(subscription.amount) * 0.01); // 1% fee
      
      const payment = await prisma.payment.create({
        data: {
          id: `0x${generateAlphanumeric(64)}-${i}`, // Mock transaction hash
          subscriptionId: subscription.id,
          amount: subscription.amount,
          processorFee: processorFee.toString(),
          processorFeeAddress: subscription.processorFeeAddress,
          transactionHash: `0x${generateAlphanumeric(64)}`,
          blockNumber: randomNumber(1000000, 2000000),
          timestamp: paymentDate,
          status: Math.random() < 0.9 ? 'SUCCESS' : 'FAILED',
          failureReason: Math.random() < 0.1 ? 'Insufficient balance' : null,
          senderAddress: subscription.senderWalletAddress!,
          recipientAddress: subscription.recipientWalletAddress!,
          swapExecuted: false,
          createdAt: paymentDate
        }
      });
      
      payments.push(payment);
    }
    
    // Update subscription payment count
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        paymentCount: paymentCount,
        nextPaymentDue: calculateNextPaymentDue(subscription.interval, paymentCount)
      }
    });
    
    console.log(`   ✅ Created ${paymentCount} payments for subscription ${subscription.id}`);
  }
  
  return payments;
}

async function generateFakeNotifications(users: any[], subscriptions: any[]) {
  console.log('🔔 Creating fake notifications...');
  
  const notifications = [];
  
  for (const user of users) {
    const userSubscriptions = subscriptions.filter(s => s.senderId === user.id);
    
    for (const subscription of userSubscriptions) {
      // Payment due notification
      if (Math.random() < 0.7) {
        const emailSent = Math.random() < 0.8;
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'PAYMENT_DUE',
            title: 'Payment Due',
            message: `Your ${subscription.serviceName} subscription payment is due`,
            isRead: Math.random() < 0.3,
            subscriptionId: subscription.id,
            metadata: {
              amount: subscription.amount,
              serviceName: subscription.serviceName,
              dueDate: subscription.nextPaymentDue
            },
            emailSent,
            emailSentAt: emailSent ? generateRecentDate(7) : null,
            createdAt: generateRecentDate(7)
          }
        });
        
        notifications.push(notification);
      }
    }
  }
  
  console.log(`   ✅ Created ${notifications.length} notifications`);
  return notifications;
}

async function main() {
  console.log('🎭 Starting fake subscription data generation...\n');
  
  try {
    // Clear existing fake data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning up existing fake data...');
    await prisma.payment.deleteMany({ where: { transactionHash: { contains: 'fake' } } });
    await prisma.subscription.deleteMany({ where: { chainId: 31337 } });
    await prisma.notification.deleteMany({ where: { title: { contains: 'Payment Due' } } });
    await prisma.connectedWallet.deleteMany({ where: { label: { in: ['MetaMask', 'Hardware Wallet', 'Coinbase Wallet', 'Trust Wallet'] } } });
    await prisma.paymentAddress.deleteMany({ where: { label: { in: ['Main Wallet', 'Business Wallet', 'Personal Wallet', 'Trading Wallet'] } } });
    await prisma.user.deleteMany({ where: { email: { contains: '@faker' } } });
    console.log('   ✅ Cleanup complete\n');
    
    // Generate fake data
    const users = await generateFakeUsers();
    console.log('');
    
    const wallets = await generateFakeWallets(users);
    console.log('');
    
    const addresses = await generateFakePaymentAddresses(users);
    console.log('');
    
    const subscriptions = await generateFakeSubscriptions(users, wallets, addresses);
    console.log('');
    
    const payments = await generateFakePayments(subscriptions);
    console.log('');
    
    const notifications = await generateFakeNotifications(users, subscriptions);
    console.log('');
    
    // Generate blockchain event data for back-propagation
    console.log('📋 Generating blockchain event data for back-propagation...');
    const blockchainEvents = subscriptions.map(sub => ({
      subscriptionId: parseInt(sub.onChainId),
      senderAddress: sub.senderWalletAddress,
      senderId: parseInt(sub.senderId),
      recipientId: parseInt(sub.recipientId),
      amount: sub.amount,
      interval: sub.interval,
      nextPaymentDue: Math.floor(sub.nextPaymentDue.getTime() / 1000),
      endDate: sub.endDate ? Math.floor(sub.endDate.getTime() / 1000) : 0,
      maxPayments: sub.maxPayments || 0,
      serviceName: sub.serviceName,
      recipientAddress: sub.recipientWalletAddress,
      senderCurrency: sub.senderCurrency,
      recipientCurrency: sub.recipientCurrency,
      processorFee: sub.processorFee,
      processorFeeAddress: sub.processorFeeAddress,
      processorFeeCurrency: sub.processorFeeCurrency,
      processorFeeID: parseInt(sub.processorFeeID),
      timestamp: Math.floor(sub.createdAt.getTime() / 1000)
    }));
    
    // Save blockchain events to file
    const fs = require('fs');
    const path = require('path');
    
    const eventsFile = path.join(__dirname, '../fake-subscription-events.json');
    fs.writeFileSync(eventsFile, JSON.stringify(blockchainEvents, null, 2));
    
    console.log('   ✅ Blockchain events saved to:', eventsFile);
    console.log('');
    
    // Summary
    console.log('🎉 Fake data generation complete!');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🔗 Wallets: ${wallets.length}`);
    console.log(`   💳 Payment Addresses: ${addresses.length}`);
    console.log(`   📋 Subscriptions: ${subscriptions.length}`);
    console.log(`   💰 Payments: ${payments.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Run the back-propagation script to create blockchain events');
    console.log('   2. Start the Envio indexer to process the events');
    console.log('   3. Test your frontend with the fake data');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error generating fake data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
