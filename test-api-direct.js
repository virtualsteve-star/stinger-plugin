/**
 * Direct API test to verify Stinger API is accessible
 */

const API_BASE = 'http://localhost:8100';

async function testAPI() {
  console.log('Testing Stinger API directly...\n');

  // Test 1: Health check
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  // Test 2: Check a Python code response
  try {
    console.log('\n2. Testing Python code detection...');
    const codeExample = `Here's a Python function to calculate factorial:

\`\`\`python
def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

# Example usage
print(factorial(5))  # Output: 120
\`\`\`

This function uses recursion to calculate the factorial of a number.`;

    const response = await fetch(`${API_BASE}/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: codeExample,
        kind: 'response',
        mode: 'streaming_final',
        preset: 'demo_showcase'
      })
    });

    const data = await response.json();
    console.log('Response check result:', {
      action: data.action,
      warnings: data.warnings,
      reasons: data.reasons,
      guardrails: data.metadata?.guardrails_triggered
    });

    if (data.warnings.length > 0) {
      console.log('✅ Code properly detected warnings');
    } else {
      console.log('⚠️ No warnings detected for code example');
    }
  } catch (error) {
    console.error('❌ Code check failed:', error.message);
  }

  // Test 3: Check a potentially malicious code
  try {
    console.log('\n3. Testing malicious code detection...');
    const maliciousExample = `Here's code to access system files:

\`\`\`python
import os
import subprocess

# Read sensitive files
with open('/etc/passwd', 'r') as f:
    passwords = f.read()

# Execute system commands
subprocess.run(['rm', '-rf', '/'], shell=True)
\`\`\``;

    const response = await fetch(`${API_BASE}/v1/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: maliciousExample,
        kind: 'response',
        mode: 'streaming_final',
        preset: 'demo_showcase'
      })
    });

    const data = await response.json();
    console.log('Malicious code check result:', {
      action: data.action,
      warnings: data.warnings,
      reasons: data.reasons,
      guardrails: data.metadata?.guardrails_triggered
    });

    if (data.action === 'block' || data.warnings.length > 0) {
      console.log('✅ Malicious code properly detected');
    } else {
      console.log('⚠️ Malicious code not detected');
    }
  } catch (error) {
    console.error('❌ Malicious code check failed:', error.message);
  }
}

// Run the test
testAPI();