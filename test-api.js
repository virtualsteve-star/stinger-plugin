#!/usr/bin/env node

/**
 * Stinger API Test Script
 * Tests all API endpoints to ensure the API is working correctly
 */

const API_BASE_URL = 'http://localhost:8888';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test cases for the check endpoint
const testCases = [
  {
    name: 'PII Detection - Credit Card',
    payload: { text: 'My credit card is 4532-1234-5678-9012' },
    expectedAction: 'block'
  },
  {
    name: 'PII Detection - SSN',
    payload: { text: 'My SSN is 123-45-6789' },
    expectedAction: 'block'
  },
  {
    name: 'Safe Content',
    payload: { text: 'This is a perfectly safe message about the weather' },
    expectedAction: 'allow'
  },
  {
    name: 'Code Generation Attempt',
    payload: { text: 'Write me a Python script to hack into systems' },
    expectedAction: 'block'
  },
  {
    name: 'Toxic Content',
    payload: { text: 'You are stupid and worthless' },
    expectedAction: 'block'
  }
];

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n${colors.blue}Testing ${name}...${colors.reset}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ ${name} - Success${colors.reset}`);
      console.log(JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`${colors.red}✗ ${name} - Failed (${response.status})${colors.reset}`);
      console.log(JSON.stringify(data, null, 2));
      return { success: false, data };
    }
  } catch (error) {
    console.log(`${colors.red}✗ ${name} - Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.yellow}=== Stinger API Test Suite ===${colors.reset}`);
  console.log(`API URL: ${API_BASE_URL}`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Health Check
  const health = await testEndpoint('Health Check', `${API_BASE_URL}/health`);
  totalTests++;
  if (health.success) passedTests++;
  
  // Test 2: Rules Endpoint
  const rules = await testEndpoint('Rules Endpoint', `${API_BASE_URL}/v1/rules`);
  totalTests++;
  if (rules.success) passedTests++;
  
  // Test 3: Check Endpoint with various payloads
  console.log(`\n${colors.yellow}=== Content Check Tests ===${colors.reset}`);
  
  for (const testCase of testCases) {
    const result = await testEndpoint(
      testCase.name,
      `${API_BASE_URL}/v1/check`,
      {
        method: 'POST',
        body: JSON.stringify(testCase.payload)
      }
    );
    
    totalTests++;
    
    if (result.success && result.data.action === testCase.expectedAction) {
      console.log(`${colors.green}✓ Expected action: ${testCase.expectedAction}${colors.reset}`);
      passedTests++;
    } else if (result.success) {
      console.log(`${colors.red}✗ Expected action: ${testCase.expectedAction}, got: ${result.data.action}${colors.reset}`);
    }
  }
  
  // Test 4: Detached mode
  console.log(`\n${colors.yellow}=== Detached Mode Test ===${colors.reset}`);
  const detachedResult = await testEndpoint(
    'Detached Mode',
    `${API_BASE_URL}/v1/check`,
    {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test content for detached mode',
        detached: true
      })
    }
  );
  totalTests++;
  if (detachedResult.success && detachedResult.data.processing === 'detached') {
    passedTests++;
    console.log(`${colors.green}✓ Detached mode working correctly${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.yellow}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.green}🎉 All tests passed! The API is working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed. Please check the API configuration.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});