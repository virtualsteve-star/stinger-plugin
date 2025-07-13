/**
 * Stinger API Client Test for Chrome Extension
 * This simulates how the Chrome extension will interact with the API
 */

interface CheckRequest {
  text: string;
  tenantId?: string;
  userId?: string;
  kind?: 'prompt' | 'response';
  detached?: boolean;
}

interface CheckResponse {
  action: 'allow' | 'warn' | 'block';
  reasons: string[];
  warnings: string[];
  metadata: {
    guardrails_triggered: string[];
    processing_time_ms: number;
  };
}

interface RulesResponse {
  preset: string;
  guardrails: {
    input_guardrails: Record<string, any>;
    output_guardrails: Record<string, any>;
  };
  version: string;
}

interface HealthResponse {
  status: string;
  pipeline_available: boolean;
  guardrail_count: number;
  api_key_configured: boolean;
}

class StingerAPIClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8888', timeout: number = 2000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async checkContent(request: CheckRequest): Promise<CheckResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Request timeout - falling back to warn mode');
        return {
          action: 'warn',
          reasons: ['API timeout - defaulting to warn'],
          warnings: ['Could not validate content due to timeout'],
          metadata: {
            guardrails_triggered: [],
            processing_time_ms: this.timeout,
          },
        };
      }
      throw error;
    }
  }

  async getRules(): Promise<RulesResponse> {
    const response = await fetch(`${this.baseUrl}/v1/rules`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.status}`);
    }
    return await response.json();
  }

  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  }
}

// Simulate Chrome extension usage
async function simulateExtensionUsage() {
  console.log('🔧 Simulating Chrome Extension API Usage\n');
  
  const client = new StingerAPIClient();
  
  // 1. Health check on startup
  console.log('1️⃣ Extension Startup - Health Check');
  try {
    const health = await client.health();
    console.log('✅ API is healthy:', health);
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    return;
  }
  
  // 2. Fetch rules on startup
  console.log('\n2️⃣ Fetching Guardrail Rules');
  try {
    const rules = await client.getRules();
    console.log('✅ Rules loaded:', {
      preset: rules.preset,
      version: rules.version,
      inputGuardrails: Object.keys(rules.guardrails.input_guardrails),
      outputGuardrails: Object.keys(rules.guardrails.output_guardrails),
    });
  } catch (error) {
    console.error('❌ Failed to fetch rules:', error.message);
  }
  
  // 3. Simulate user interactions
  const testScenarios = [
    {
      name: 'User types safe prompt',
      request: {
        text: 'What is the weather like today?',
        kind: 'prompt' as const,
        tenantId: 'acme-corp',
        userId: 'user123',
      },
    },
    {
      name: 'User pastes credit card',
      request: {
        text: 'Process payment with card 4532-1234-5678-9012',
        kind: 'prompt' as const,
        tenantId: 'acme-corp',
        userId: 'user123',
      },
    },
    {
      name: 'Model returns SSN',
      request: {
        text: 'Your SSN is 123-45-6789',
        kind: 'response' as const,
        tenantId: 'acme-corp',
        userId: 'user123',
      },
    },
  ];
  
  console.log('\n3️⃣ Simulating User Interactions\n');
  
  for (const scenario of testScenarios) {
    console.log(`📝 ${scenario.name}`);
    try {
      const result = await client.checkContent(scenario.request);
      
      console.log(`   Action: ${result.action}`);
      if (result.reasons.length > 0) {
        console.log(`   Reasons: ${result.reasons.join(', ')}`);
      }
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
      
      // Simulate UI behavior
      switch (result.action) {
        case 'block':
          console.log('   🚫 UI: Content blocked, showing error message');
          break;
        case 'warn':
          console.log('   ⚠️  UI: Showing warning banner');
          break;
        case 'allow':
          console.log('   ✅ UI: Content allowed');
          break;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  // 4. Test timeout behavior
  console.log('4️⃣ Testing Timeout Behavior');
  const slowClient = new StingerAPIClient('http://localhost:8888', 100); // 100ms timeout
  try {
    const result = await slowClient.checkContent({
      text: 'Test timeout',
      detached: false,
    });
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the simulation
simulateExtensionUsage().catch(console.error);