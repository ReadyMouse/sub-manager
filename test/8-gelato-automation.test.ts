/**
 * Gelato Automation Test Pointer
 * 
 * This file serves as a pointer to the gelato-automation test suite,
 * allowing the gelato tests to run when executing `npx hardhat test`
 * while keeping the gelato-automation module self-contained and extractable.
 * 
 * The actual test implementation is in: gelato-automation/test/gelato-automation.test.ts
 * 
 * This approach:
 * - Includes gelato tests in the main test suite
 * - Includes gelato tests in coverage reports
 * - Maintains gelato-automation as a standalone module
 * - Preserves the ability to extract gelato-automation without breaking tests
 */

// Import and re-export the gelato automation tests
// The path is relative from /test to /gelato-automation/test
import '../gelato-automation/test/gelato-automation.test';

// No additional code needed - the import will execute the test suite
// when Hardhat's test runner loads this file

