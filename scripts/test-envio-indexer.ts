#!/usr/bin/env tsx

/**
 * ============================================================
 * ENVIO INDEXER TEST SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Tests the Envio indexer by querying the GraphQL endpoint and verifying
 * that the fake subscription data has been properly indexed
 * 
 * HOW TO RUN:
 * npx tsx scripts/test-envio-indexer.ts
 * 
 * WHAT IT DOES:
 * 1. Queries the Envio GraphQL endpoint
 * 2. Verifies subscription events are indexed
 * 3. Verifies payment events are indexed
 * 4. Compares indexed data with database data
 * 5. Generates a test report
 */

import { PrismaClient } from '../backend/node_modules/@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  envioEndpoint: 'http://localhost:8080/graphql',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
};

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  data?: any;
}

interface EnvioSubscription {
  id: string;
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  amount: string;
  interval: string;
  nextPaymentDue: string;
  endDate: string;
  maxPayments: string;
  serviceName: string;
  recipientAddress: string;
  senderCurrency: string;
  recipientCurrency: string;
  processorFee: string;
  processorFeeAddress: string;
  processorFeeCurrency: string;
  processorFeeID: string;
  timestamp: string;
}

interface EnvioPayment {
  id: string;
  subscriptionId: string;
  senderAddress: string;
  senderId: string;
  recipientId: string;
  amount: string;
  processorFee: string;
  processorFeeAddress: string;
  paymentCount: string;
  timestamp: string;
  nextPaymentDue: string;
}

async function makeGraphQLQuery(query: string, variables: any = {}): Promise<any> {
  const response = await fetch(CONFIG.envioEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  
  return data.data;
}

async function testEnvioConnection(): Promise<TestResult> {
  console.log('🔍 Testing Envio connection...');
  
  try {
    const query = `
      query {
        __schema {
          types {
            name
          }
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    
    return {
      testName: 'Envio Connection',
      passed: true,
      message: 'Successfully connected to Envio GraphQL endpoint',
      data: data.__schema?.types?.length || 0
    };
    
  } catch (error) {
    return {
      testName: 'Envio Connection',
      passed: false,
      message: `Failed to connect to Envio: ${error.message}`,
    };
  }
}

async function testSubscriptionEvents(): Promise<TestResult> {
  console.log('📋 Testing subscription events...');
  
  try {
    const query = `
      query {
        stableRentSubscription_SubscriptionCreateds(first: 100) {
          id
          subscriptionId
          senderAddress
          senderId
          recipientId
          amount
          interval
          nextPaymentDue
          endDate
          maxPayments
          serviceName
          recipientAddress
          senderCurrency
          recipientCurrency
          processorFee
          processorFeeAddress
          processorFeeCurrency
          processorFeeID
          timestamp
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    const subscriptions = data.stableRentSubscription_SubscriptionCreateds || [];
    
    return {
      testName: 'Subscription Events',
      passed: subscriptions.length > 0,
      message: `Found ${subscriptions.length} subscription events`,
      data: subscriptions
    };
    
  } catch (error) {
    return {
      testName: 'Subscription Events',
      passed: false,
      message: `Failed to query subscription events: ${error.message}`,
    };
  }
}

async function testPaymentEvents(): Promise<TestResult> {
  console.log('💰 Testing payment events...');
  
  try {
    const query = `
      query {
        stableRentSubscription_PaymentProcesseds(first: 100) {
          id
          subscriptionId
          senderAddress
          senderId
          recipientId
          amount
          processorFee
          processorFeeAddress
          paymentCount
          timestamp
          nextPaymentDue
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    const payments = data.stableRentSubscription_PaymentProcesseds || [];
    
    return {
      testName: 'Payment Events',
      passed: payments.length > 0,
      message: `Found ${payments.length} payment events`,
      data: payments
    };
    
  } catch (error) {
    return {
      testName: 'Payment Events',
      passed: false,
      message: `Failed to query payment events: ${error.message}`,
    };
  }
}

async function testFailedPaymentEvents(): Promise<TestResult> {
  console.log('❌ Testing failed payment events...');
  
  try {
    const query = `
      query {
        stableRentSubscription_PaymentFaileds(first: 100) {
          id
          subscriptionId
          senderAddress
          senderId
          recipientId
          amount
          timestamp
          reason
          failedCount
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    const failedPayments = data.stableRentSubscription_PaymentFaileds || [];
    
    return {
      testName: 'Failed Payment Events',
      passed: true, // This is optional, so we don't fail if there are no failed payments
      message: `Found ${failedPayments.length} failed payment events`,
      data: failedPayments
    };
    
  } catch (error) {
    return {
      testName: 'Failed Payment Events',
      passed: false,
      message: `Failed to query failed payment events: ${error.message}`,
    };
  }
}

async function testCancellationEvents(): Promise<TestResult> {
  console.log('🚫 Testing cancellation events...');
  
  try {
    const query = `
      query {
        stableRentSubscription_SubscriptionCancelleds(first: 100) {
          id
          subscriptionId
          senderAddress
          senderId
          recipientId
          timestamp
          reason
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    const cancellations = data.stableRentSubscription_SubscriptionCancelleds || [];
    
    return {
      testName: 'Cancellation Events',
      passed: true, // This is optional, so we don't fail if there are no cancellations
      message: `Found ${cancellations.length} cancellation events`,
      data: cancellations
    };
    
  } catch (error) {
    return {
      testName: 'Cancellation Events',
      passed: false,
      message: `Failed to query cancellation events: ${error.message}`,
    };
  }
}

async function compareWithDatabase(): Promise<TestResult> {
  console.log('🗄️  Comparing with database...');
  
  try {
    // Get subscription count from database
    const dbSubscriptions = await prisma.subscription.count({
      where: { chainId: 31337 }
    });
    
    // Get payment count from database
    const dbPayments = await prisma.payment.count({
      where: {
        subscription: {
          chainId: 31337
        }
      }
    });
    
    // Get indexed subscription count
    const query = `
      query {
        stableRentSubscription_SubscriptionCreateds(first: 1000) {
          subscriptionId
        }
      }
    `;
    
    const data = await makeGraphQLQuery(query);
    const indexedSubscriptions = data.stableRentSubscription_SubscriptionCreateds || [];
    
    // Get indexed payment count
    const paymentQuery = `
      query {
        stableRentSubscription_PaymentProcesseds(first: 1000) {
          subscriptionId
        }
      }
    `;
    
    const paymentData = await makeGraphQLQuery(paymentQuery);
    const indexedPayments = paymentData.stableRentSubscription_PaymentProcesseds || [];
    
    const subscriptionMatch = indexedSubscriptions.length === dbSubscriptions;
    const paymentMatch = indexedPayments.length === dbPayments;
    
    return {
      testName: 'Database Comparison',
      passed: subscriptionMatch && paymentMatch,
      message: `Database: ${dbSubscriptions} subscriptions, ${dbPayments} payments | Indexed: ${indexedSubscriptions.length} subscriptions, ${indexedPayments.length} payments`,
      data: {
        database: { subscriptions: dbSubscriptions, payments: dbPayments },
        indexed: { subscriptions: indexedSubscriptions.length, payments: indexedPayments.length }
      }
    };
    
  } catch (error) {
    return {
      testName: 'Database Comparison',
      passed: false,
      message: `Failed to compare with database: ${error.message}`,
    };
  }
}

async function testSpecificQueries(): Promise<TestResult> {
  console.log('🔍 Testing specific queries...');
  
  try {
    // Test querying by sender address
    const senderQuery = `
      query {
        stableRentSubscription_SubscriptionCreateds(
          where: { senderAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" }
        ) {
          subscriptionId
          serviceName
          senderAddress
        }
      }
    `;
    
    const senderData = await makeGraphQLQuery(senderQuery);
    const senderSubscriptions = senderData.stableRentSubscription_SubscriptionCreateds || [];
    
    // Test querying by service name
    const serviceQuery = `
      query {
        stableRentSubscription_SubscriptionCreateds(
          where: { serviceName_contains: "Netflix" }
        ) {
          subscriptionId
          serviceName
          amount
        }
      }
    `;
    
    const serviceData = await makeGraphQLQuery(serviceQuery);
    const serviceSubscriptions = serviceData.stableRentSubscription_SubscriptionCreateds || [];
    
    return {
      testName: 'Specific Queries',
      passed: true,
      message: `Sender query: ${senderSubscriptions.length} results, Service query: ${serviceSubscriptions.length} results`,
      data: {
        senderQuery: senderSubscriptions,
        serviceQuery: serviceSubscriptions
      }
    };
    
  } catch (error) {
    return {
      testName: 'Specific Queries',
      passed: false,
      message: `Failed to test specific queries: ${error.message}`,
    };
  }
}

async function generateTestReport(results: TestResult[]) {
  console.log('📊 Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      passedTests: results.filter(r => r.passed).length,
      failedTests: results.filter(r => !r.passed).length,
      successRate: (results.filter(r => r.passed).length / results.length) * 100
    },
    results: results,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (report.summary.failedTests > 0) {
    report.recommendations.push('Some tests failed. Check the Envio indexer logs for errors.');
  }
  
  if (results.find(r => r.testName === 'Envio Connection' && !r.passed)) {
    report.recommendations.push('Envio indexer is not running. Start it with: cd envio && npm run dev');
  }
  
  if (results.find(r => r.testName === 'Subscription Events' && !r.passed)) {
    report.recommendations.push('No subscription events found. Run the back-propagation script first.');
  }
  
  // Save report to file
  const reportFile = path.join(__dirname, '../envio-test-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`   ✅ Test report saved to: ${reportFile}`);
  
  return report;
}

async function main() {
  console.log('🧪 Starting Envio indexer tests...\n');
  
  const results: TestResult[] = [];
  
  try {
    // Run all tests
    results.push(await testEnvioConnection());
    results.push(await testSubscriptionEvents());
    results.push(await testPaymentEvents());
    results.push(await testFailedPaymentEvents());
    results.push(await testCancellationEvents());
    results.push(await compareWithDatabase());
    results.push(await testSpecificQueries());
    
    // Generate test report
    const report = await generateTestReport(results);
    
    // Display results
    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    
    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.message}`);
    }
    
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passedTests}`);
    console.log(`   Failed: ${report.summary.failedTests}`);
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      for (const recommendation of report.recommendations) {
        console.log(`   • ${recommendation}`);
      }
    }
    
    console.log('\n🎉 Envio indexer testing complete!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Envio indexer test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Envio indexer test script failed:', error);
    process.exit(1);
  });
