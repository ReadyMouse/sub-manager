#!/usr/bin/env node

/**
 * Test script to verify database connection and schema
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  console.log('🧪 Testing database connection and schema...\n');

  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test if subscriptions table exists and can be queried
    const subscriptionCount = await prisma.subscription.count();
    console.log(`📊 Current subscriptions in database: ${subscriptionCount}`);

    // Test if we can create a test record (without saving)
    const testData = {
      id: `11155111:test-${Date.now()}`, // Required ID field
      chainId: 11155111,
      onChainId: `test-${Date.now()}`,
      senderId: 'test-sender',
      recipientId: 'test-recipient',
      serviceName: 'Test Service',
      amount: '100.00',
      interval: 2592000,
      nextPaymentDue: new Date(),
      isActive: true,
      syncStatus: 'PENDING',
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      // Required fields
      senderWalletAddress: '0x1234567890123456789012345678901234567890',
      recipientWalletAddress: '0xe4DDC07abb37Cf651f0c99fCbAf31F3D18a53fa0',
      senderCurrency: 'PYUSD',
      recipientCurrency: 'PYUSD',
      // Optional metadata fields
      notes: 'Test notes',
      tags: ['test', 'demo'],
      serviceDescription: 'Test description'
    };

    console.log('\n📝 Test data structure:');
    console.log(`  Chain ID: ${testData.chainId}`);
    console.log(`  Service: ${testData.serviceName}`);
    console.log(`  Amount: ${testData.amount}`);
    console.log(`  Notes: ${testData.notes}`);
    console.log(`  Tags: ${testData.tags.join(', ')}`);
    console.log(`  Description: ${testData.serviceDescription}`);

    // Test creating a record (we'll delete it immediately)
    const testRecord = await prisma.subscription.create({
      data: testData
    });

    console.log('\n✅ SUCCESS: Database schema is correct and can save metadata!');
    console.log(`📝 Created test record with ID: ${testRecord.id}`);

    // Clean up - delete the test record
    await prisma.subscription.delete({
      where: { id: testRecord.id }
    });

    console.log('🧹 Cleaned up test record');

  } catch (error) {
    console.error('\n❌ DATABASE ERROR:', error.message);
    
    if (error.code === 'P2021') {
      console.log('🔍 The subscriptions table does not exist. Run database migrations first.');
    } else if (error.code === 'P1001') {
      console.log('🔍 Cannot connect to database. Check your database configuration.');
    } else {
      console.log('🔍 Full error:', error);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

testDatabase().then(() => {
  console.log('\n🏁 Database test completed');
}).catch(console.error);
