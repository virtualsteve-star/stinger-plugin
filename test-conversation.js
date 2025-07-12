#!/usr/bin/env node

/**
 * Test Script: Simulate Human-to-ChatGPT Conversation
 * 
 * This script simulates what the Stinger Guard Chrome Extension
 * sends to the API when a user interacts with ChatGPT.
 */

const API_URL = 'http://localhost:8888';

// Simulated conversation context (what the extension would send)
const conversationContext = {
  // User identification
  userId: 'test.user@company.com',
  userName: 'Test User',
  userType: 'human',
  
  // Bot identification  
  botId: 'chatgpt',
  botName: 'ChatGPT',
  botType: 'ai_model',
  botModel: 'gpt-4',
  
  // Session tracking
  sessionId: `ext-${Date.now()}-test123`,
  
  // Additional metadata
  browser: 'Chrome',
  extensionVersion: '0.1.0',
  url: 'chat.openai.com'
};

// Test scenarios
const testScenarios = [
  {
    name: 'Safe Prompt',
    text: 'How do I write a Python function to sort a list?',
    kind: 'prompt',
    expectedAction: 'allow'
  },
  {
    name: 'PII Detection - Credit Card',
    text: 'My credit card number is 4532-1234-5678-9012',
    kind: 'prompt',
    expectedAction: 'block'
  },
  {
    name: 'PII Detection - SSN',
    text: 'Please format SSN 123-45-6789 for me',
    kind: 'prompt',
    expectedAction: 'warn'
  },
  {
    name: 'Safe AI Response',
    text: 'To sort a list in Python, you can use the sorted() function or the list.sort() method.',
    kind: 'response',
    expectedAction: 'allow'
  },
  {
    name: 'AI Response with PII',
    text: 'Here is the customer record: John Doe, SSN: 987-65-4321, Address: 123 Main St',
    kind: 'response',
    expectedAction: 'warn'
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Stinger API Conversation Test\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Session ID: ${conversationContext.sessionId}`);
  console.log(`User: ${conversationContext.userId} (${conversationContext.userType})`);
  console.log(`Bot: ${conversationContext.botId} (${conversationContext.botType})\n`);
  console.log('─'.repeat(60) + '\n');

  for (const scenario of testScenarios) {
    console.log(`📝 Test: ${scenario.name}`);
    console.log(`   Type: ${scenario.kind}`);
    console.log(`   Text: "${scenario.text.substring(0, 50)}..."`);
    
    try {
      const response = await fetch(`${API_URL}/v1/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: scenario.text,
          kind: scenario.kind,
          context: conversationContext
        })
      });

      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status}`);
        continue;
      }

      const result = await response.json();
      const success = result.action === scenario.expectedAction;
      
      console.log(`   Result: ${result.action} ${success ? '✅' : '❌'}`);
      
      if (result.reasons?.length > 0) {
        console.log(`   Reasons: ${result.reasons.join(', ')}`);
      }
      if (result.warnings?.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('─'.repeat(60));
  console.log('\n✅ Test complete! Check Stinger API logs for audit entries.\n');
}

// Check if API is available
async function checkAPI() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const health = await response.json();
    console.log(`✅ API Health: ${health.status}\n`);
    return true;
  } catch (error) {
    console.error(`❌ API not available at ${API_URL}`);
    console.error(`   Error: ${error.message}`);
    console.error('\n   Please ensure Stinger API is running!');
    return false;
  }
}

// Main
async function main() {
  const apiAvailable = await checkAPI();
  if (apiAvailable) {
    await runTests();
  }
}

main().catch(console.error);