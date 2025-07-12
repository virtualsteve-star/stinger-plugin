# 📢 Core Team: Conversation Tracking Verification Guide

**To**: Stinger Core API Team  
**From**: Chrome Extension Team  
**Date**: January 12, 2025  
**Subject**: How to Verify Conversation Tracking is Working

## Quick Test

We've created a test script that simulates the Chrome extension sending conversation data:

```bash
# Run the test script
node test-conversation.js
```

This sends 5 test scenarios through your API with full conversation context.

## What to Look For in Your Logs

### 1. **Conversation Context in Audit Entries**

Your audit logs should now show entries like:

```json
{
  "timestamp": "2025-01-12T15:30:45.123Z",
  "action": "block",
  "kind": "prompt",
  "text": "[REDACTED]",
  "userId": "test.user@company.com",
  "userName": "Test User",
  "userType": "human",
  "botId": "chatgpt",
  "botName": "ChatGPT", 
  "botType": "ai_model",
  "botModel": "gpt-4",
  "sessionId": "ext-1736694645123-test123",
  "browser": "Chrome",
  "extensionVersion": "0.1.0",
  "url": "chat.openai.com",
  "reasons": ["credit_card_detected"],
  "guardrails_triggered": ["pii_filter"]
}
```

### 2. **Key Fields to Verify**

✅ **User Identification**:
- `userId`: "test.user@company.com"
- `userName`: "Test User"  
- `userType`: "human"

✅ **Bot Identification**:
- `botId`: "chatgpt"
- `botName`: "ChatGPT"
- `botType`: "ai_model"
- `botModel`: "gpt-4"

✅ **Session Tracking**:
- `sessionId`: Should be consistent for all 5 test requests
- Format: `ext-{timestamp}-{random}`

✅ **Metadata**:
- `browser`: "Chrome"
- `extensionVersion`: "0.1.0"
- `url`: "chat.openai.com"

### 3. **Expected Test Results**

The test script sends 5 scenarios:

1. **Safe Prompt** → Should return `action: "allow"`
2. **Credit Card in Prompt** → Should return `action: "block"`
3. **SSN in Prompt** → Should return `action: "warn"` or `"block"`
4. **Safe AI Response** → Should return `action: "allow"`
5. **AI Response with PII** → Should return `action: "warn"`

### 4. **Audit Log Format Examples**

**Human asking ChatGPT (blocked)**:
```
test.user@company.com (human) <-> chatgpt (ai_model) - BLOCKED - Credit card in prompt
```

**Human asking ChatGPT (allowed)**:
```
test.user@company.com (human) <-> chatgpt (ai_model) - ALLOWED - Python programming question
```

### 5. **Session Correlation**

All 5 test requests should have the **same sessionId**, allowing you to:
- Group related conversations
- Track conversation flow
- Analyze patterns within a session

### 6. **What Success Looks Like**

In your logs, you should see:
- ✅ All context fields populated (not just userId)
- ✅ Participant types clearly identified
- ✅ Session IDs linking related checks
- ✅ Browser and extension metadata
- ✅ Proper PII detection triggering

### 7. **Common Issues to Check**

If context is missing:
- Ensure you're reading from `request.context` object
- Check that all fields are being stored in audit log
- Verify no fields are being filtered out

### 8. **Quick Verification Commands**

```bash
# Check if API received context (adjust for your logging)
grep "test.user@company.com" /path/to/stinger/logs

# Verify all 5 scenarios logged
grep "ext-.*-test123" /path/to/stinger/logs | wc -l
# Should show 5 entries

# Check participant types logged
grep "human.*ai_model" /path/to/stinger/logs
```

## Why This Matters

With this context, your audit logs can now answer:
- **WHO**: test.user@company.com (Test User)
- **WHAT TYPE**: human user (not a bot/agent)
- **TALKING TO**: ChatGPT (ai_model, specifically gpt-4)
- **WHEN**: Timestamp with session correlation
- **WHERE**: Chrome browser, extension v0.1.0
- **WHAT**: The actual content checked
- **RESULT**: Allow/warn/block with reasons

## Next Steps

1. Run the test script
2. Verify all context fields appear in audit logs
3. Confirm SIEM export includes these fields
4. Let us know if any fields are missing!

## Questions?

The test script simulates exactly what our Chrome extension sends. If you see any issues or need different field names/formats, please let us know!

**Expected API Response Format**:
```json
{
  "action": "allow|warn|block",
  "reasons": ["array", "of", "reasons"],
  "warnings": ["array", "of", "warnings"],
  "metadata": {
    "guardrails_triggered": ["pii_filter"],
    "processing_time_ms": 45
  }
}
```

---

**Note**: The Chrome extension is now sending this enhanced context with every check request. Existing integrations without context will still work (backward compatible), but won't have the rich audit trail.