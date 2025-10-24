#!/usr/bin/env tsx

/**
 * Cleanup script to remove all fake data from the database
 */

import { PrismaClient } from '../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up fake data...\n');
  
  try {
    // Delete in correct order to respect foreign key constraints
    console.log('   Deleting notifications...');
    const notifications = await prisma.notification.deleteMany({});
    console.log(`   ✅ Deleted ${notifications.count} notifications`);
    
    console.log('   Deleting payments...');
    const payments = await prisma.payment.deleteMany({});
    console.log(`   ✅ Deleted ${payments.count} payments`);
    
    console.log('   Deleting subscriptions...');
    const subscriptions = await prisma.subscription.deleteMany({});
    console.log(`   ✅ Deleted ${subscriptions.count} subscriptions`);
    
    console.log('   Deleting payment addresses...');
    const paymentAddresses = await prisma.paymentAddress.deleteMany({});
    console.log(`   ✅ Deleted ${paymentAddresses.count} payment addresses`);
    
    console.log('   Deleting connected wallets...');
    const wallets = await prisma.connectedWallet.deleteMany({});
    console.log(`   ✅ Deleted ${wallets.count} wallets`);
    
    console.log('   Deleting users...');
    const users = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${users.count} users`);
    
    console.log('\n✅ Cleanup complete!\n');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
