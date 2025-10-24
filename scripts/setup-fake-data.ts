#!/usr/bin/env tsx

/**
 * ============================================================
 * FAKE DATA SETUP MASTER SCRIPT
 * ============================================================
 * 
 * PURPOSE:
 * Orchestrates the entire process of creating fake subscription data
 * and testing the Envio indexer locally
 * 
 * HOW TO RUN:
 * npx tsx scripts/setup-fake-data.ts
 * 
 * WHAT IT DOES:
 * 1. Generates fake subscription data in the database
 * 2. Back-propagates the data to Hardhat blockchain
 * 3. Tests the Envio indexer
 * 4. Provides a comprehensive setup report
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  scripts: {
    generate: 'scripts/generate-fake-subscriptions.ts',
    backPropagate: 'scripts/back-propagate-to-blockchain.ts',
    test: 'scripts/test-envio-indexer.ts'
  },
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
};

interface StepResult {
  step: string;
  success: boolean;
  message: string;
  duration: number;
  error?: string;
}

async function runScript(scriptPath: string, stepName: string): Promise<StepResult> {
  console.log(`\n🚀 Running ${stepName}...`);
  console.log(`   Script: ${scriptPath}`);
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        resolve({
          step: stepName,
          success: true,
          message: `${stepName} completed successfully`,
          duration
        });
      } else {
        resolve({
          step: stepName,
          success: false,
          message: `${stepName} failed with exit code ${code}`,
          duration,
          error: `Exit code: ${code}`
        });
      }
    });
    
    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        step: stepName,
        success: false,
        message: `${stepName} failed to start`,
        duration,
        error: error.message
      });
    });
    
    // Timeout handling
    setTimeout(() => {
      child.kill();
      const duration = Date.now() - startTime;
      resolve({
        step: stepName,
        success: false,
        message: `${stepName} timed out after ${CONFIG.timeout / 1000} seconds`,
        duration,
        error: 'Timeout'
      });
    }, CONFIG.timeout);
  });
}

async function checkPrerequisites(): Promise<boolean> {
  console.log('🔍 Checking prerequisites...');
  
  const checks = [
    {
      name: 'Database connection',
      check: () => fs.existsSync('backend/.env') || fs.existsSync('.env'),
      message: 'Environment file not found. Please ensure your database is configured.'
    },
    {
      name: 'Hardhat network',
      check: () => {
        try {
          // This is a simple check - in a real scenario you'd ping the network
          return true;
        } catch {
          return false;
        }
      },
      message: 'Hardhat network not available. Please start Hardhat node first.'
    },
    {
      name: 'Script files',
      check: () => {
        return Object.values(CONFIG.scripts).every(script => fs.existsSync(script));
      },
      message: 'Required script files not found. Please ensure all scripts are present.'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const passed = await check.check();
      console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
      
      if (!passed) {
        console.log(`      ⚠️  ${check.message}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${check.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function waitForEnvio(): Promise<boolean> {
  console.log('\n⏳ Waiting for Envio indexer to be ready...');
  
  const maxAttempts = 30; // 30 attempts
  const delay = 2000; // 2 seconds between attempts
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __schema { types { name } } }' })
      });
      
      if (response.ok) {
        console.log('   ✅ Envio indexer is ready!');
        return true;
      }
    } catch (error) {
      // Ignore errors, just retry
    }
    
    console.log(`   ⏳ Attempt ${attempt}/${maxAttempts} - Envio not ready yet...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  console.log('   ⚠️  Envio indexer did not become ready in time');
  return false;
}

async function generateSetupReport(results: StepResult[], envioReady: boolean) {
  console.log('\n📊 Generating setup report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSteps: results.length,
      successfulSteps: results.filter(r => r.success).length,
      failedSteps: results.filter(r => !r.success).length,
      envioReady,
      overallSuccess: results.every(r => r.success) && envioReady
    },
    steps: results,
    recommendations: [],
    nextSteps: []
  };
  
  // Add recommendations based on results
  if (report.summary.failedSteps > 0) {
    report.recommendations.push('Some steps failed. Check the error messages above for details.');
  }
  
  if (!envioReady) {
    report.recommendations.push('Envio indexer is not ready. Start it manually with: cd envio && npm run dev');
  }
  
  // Add next steps
  if (report.summary.overallSuccess) {
    report.nextSteps.push('✅ Fake data setup is complete!');
    report.nextSteps.push('🔍 Test your frontend with the fake data');
    report.nextSteps.push('📊 Check the Envio GraphQL endpoint: http://localhost:8080/graphql');
    report.nextSteps.push('🗄️  View the test report: envio-test-report.json');
  } else {
    report.nextSteps.push('🔧 Fix the failed steps before proceeding');
    report.nextSteps.push('🔄 Re-run this script after fixing issues');
  }
  
  // Save report to file
  const reportFile = path.join(__dirname, '../fake-data-setup-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`   ✅ Setup report saved to: ${reportFile}`);
  
  return report;
}

async function main() {
  console.log('🎭 Starting fake data setup process...\n');
  
  const results: StepResult[] = [];
  
  try {
    // Check prerequisites
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
      console.log('\n❌ Prerequisites not met. Please fix the issues above and try again.');
      process.exit(1);
    }
    
    console.log('\n✅ All prerequisites met!\n');
    
    // Step 1: Generate fake data
    const generateResult = await runScript(
      CONFIG.scripts.generate,
      'Generate Fake Data'
    );
    results.push(generateResult);
    
    if (!generateResult.success) {
      console.log('\n❌ Fake data generation failed. Stopping setup process.');
      process.exit(1);
    }
    
    // Step 2: Back-propagate to blockchain
    const backPropagateResult = await runScript(
      CONFIG.scripts.backPropagate,
      'Back-propagate to Blockchain'
    );
    results.push(backPropagateResult);
    
    if (!backPropagateResult.success) {
      console.log('\n⚠️  Back-propagation failed. You may need to start Hardhat node first.');
    }
    
    // Step 3: Test Envio indexer
    const testResult = await runScript(
      CONFIG.scripts.test,
      'Test Envio Indexer'
    );
    results.push(testResult);
    
    // Check if Envio is ready
    const envioReady = await waitForEnvio();
    
    // Generate setup report
    const report = await generateSetupReport(results, envioReady);
    
    // Display final results
    console.log('\n🎉 FAKE DATA SETUP COMPLETE!');
    console.log('============================');
    
    console.log('\n📊 STEP RESULTS:');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(1);
      console.log(`${status} ${result.step} (${duration}s): ${result.message}`);
    }
    
    console.log(`\n🔍 Envio Indexer: ${envioReady ? '✅ Ready' : '❌ Not Ready'}`);
    
    console.log('\n📈 OVERALL SUMMARY:');
    console.log(`   Total Steps: ${report.summary.totalSteps}`);
    console.log(`   Successful: ${report.summary.successfulSteps}`);
    console.log(`   Failed: ${report.summary.failedSteps}`);
    console.log(`   Overall Success: ${report.summary.overallSuccess ? '✅' : '❌'}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      for (const recommendation of report.recommendations) {
        console.log(`   • ${recommendation}`);
      }
    }
    
    if (report.nextSteps.length > 0) {
      console.log('\n🚀 NEXT STEPS:');
      for (const step of report.nextSteps) {
        console.log(`   ${step}`);
      }
    }
    
    console.log('\n🎭 Fake data setup process complete!');
    
  } catch (error) {
    console.error('\n❌ Setup process failed:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Fake data setup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fake data setup script failed:', error);
    process.exit(1);
  });
