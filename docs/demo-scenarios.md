# Stinger Guard Demo Scenarios

## Overview

These demo scenarios showcase the Stinger Guard Chrome Extension's ability to intercept ChatGPT traffic and enforce security guardrails. Each scenario demonstrates a key security feature.

## Prerequisites

1. **Stinger API Running**: Ensure the Stinger API is running on `http://localhost:8888`
2. **Extension Installed**: Load the extension in Chrome Developer mode
3. **ChatGPT Open**: Navigate to https://chat.openai.com

## Demo Scenarios

### Scenario 1: PII Protection - Credit Card Blocking

**Purpose**: Demonstrate blocking of sensitive financial information

**Steps**:
1. Open ChatGPT
2. Type: "My credit card number is 4532-1234-5678-9012"
3. Press Enter or click Send

**Expected Result**:
- ❌ Prompt is **BLOCKED**
- 🚫 Red overlay appears: "Prompt Blocked by Stinger"
- Reason displayed: "Credit card number detected"
- Audit log shows: `alice@company.com (human) <-> chatgpt (ai_model) - BLOCKED - Credit card in prompt`

### Scenario 2: PII Warning - SSN Detection

**Purpose**: Show warning mode for sensitive data

**Steps**:
1. Type: "Can you help me format SSN 123-45-6789 for a form?"
2. Press Enter

**Expected Result**:
- ⚠️ Warning dialog appears
- User can choose to proceed or cancel
- If proceeded, audit log shows: `alice@company.com (human) <-> chatgpt (ai_model) - WARNED - SSN detected`

### Scenario 3: Safe Conversation - Allowed

**Purpose**: Demonstrate normal flow for safe content

**Steps**:
1. Type: "How do I write a Python function to sort a list?"
2. Press Enter

**Expected Result**:
- ✅ Prompt sent immediately
- No interruption to user flow
- Audit log shows: `alice@company.com (human) <-> chatgpt (ai_model) - ALLOWED`

### Scenario 4: Response Monitoring

**Purpose**: Show detection of sensitive data in AI responses

**Steps**:
1. Ask ChatGPT: "Generate a sample customer record"
2. If response contains SSN/credit card patterns

**Expected Result**:
- ⚠️ Yellow warning banner appears on the response
- Warning: "This response contains sensitive data"
- Response remains visible but flagged

### Scenario 5: API Timeout Fallback

**Purpose**: Demonstrate graceful degradation

**Steps**:
1. Stop the Stinger API
2. Try to send a prompt
3. Wait 2 seconds

**Expected Result**:
- ⚠️ Warning mode activated
- Message: "Security check unavailable - proceeding with caution"
- Conversation continues but all activity logged

### Scenario 6: Multi-Tab Support

**Purpose**: Show extension works across multiple ChatGPT tabs

**Steps**:
1. Open 3 ChatGPT tabs
2. Send different prompts in each
3. Check popup UI

**Expected Result**:
- All tabs protected simultaneously
- Each conversation tracked separately
- Audit logs show different session IDs

### Scenario 7: User Configuration

**Purpose**: Demonstrate user identification setup

**Steps**:
1. Click extension icon
2. Enter email: "demo@company.com"
3. Enter name: "Demo User"
4. Save configuration

**Expected Result**:
- Configuration saved
- Future audit logs show: `demo@company.com (human) <-> chatgpt (ai_model)`
- User identity persists across sessions

### Scenario 8: Agent Detection (Future)

**Purpose**: Show bot/agent detection

**Steps**:
1. Navigate to ChatGPT with `?automated=true` parameter
2. Send a prompt

**Expected Result**:
- Audit log shows: `automated-bot (bot) <-> chatgpt (ai_model)`
- Different guardrails may apply

## Technical Verification

### Check Audit Logs

After running demos, verify audit entries:

```bash
# Check Stinger API logs
curl http://localhost:8888/v1/audit/recent

# Expected format:
{
  "timestamp": "2025-01-12T10:30:00Z",
  "userId": "alice@company.com",
  "userType": "human",
  "botId": "chatgpt",
  "botType": "ai_model",
  "action": "block",
  "reason": "Credit card detected",
  "text": "[REDACTED]"
}
```

### Performance Metrics

- Latency impact: < 100ms
- Memory usage: < 50MB
- CPU usage: Minimal

### Extension Health Check

1. Click extension icon
2. Check "API: Connected" status
3. Test API button should return success

## Troubleshooting

### Extension Not Working
- Check Chrome DevTools console for errors
- Verify API is running: `curl http://localhost:8888/health`
- Reload extension in chrome://extensions

### Prompts Not Intercepted
- Refresh ChatGPT page
- Check content script is loaded (DevTools > Sources)
- Verify correct ChatGPT URL

### API Connection Failed
- Check API URL in popup settings
- Verify no firewall blocking
- Check CORS settings on API

## Demo Talk Track

"Let me show you how Stinger Guard protects your organization from data leaks in ChatGPT...

1. **Immediate Protection**: Watch as I try to share a credit card number... [BLOCKED]

2. **Smart Warnings**: For borderline cases like this SSN formatting question, we warn but let users decide...

3. **Invisible for Safe Use**: Normal programming questions flow through seamlessly...

4. **Complete Audit Trail**: Every interaction is logged with full context - who talked to which AI about what...

5. **Enterprise Ready**: Multi-tab support, user identification, and graceful failover ensure reliability...

This proof of concept demonstrates how we can extend this protection to all LLM interactions across your organization."

## Next Steps

After successful demo:
1. Discuss additional guardrails needed
2. Plan rollout strategy
3. Configure SIEM integration
4. Set up user training

## Success Metrics

- 100% prompt capture rate ✅
- Zero false negatives for demo patterns ✅
- < 100ms latency impact ✅
- Clear audit trail ✅
- Positive stakeholder feedback 🎯