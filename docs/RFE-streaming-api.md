# RFE: Add streaming-aware API endpoints for real-time content checking

## Request for Enhancement

The Stinger Plugin team has identified performance and scalability issues when checking streaming LLM responses. We need API enhancements to better support real-time content monitoring.

## Background

Browser extensions monitoring LLM interfaces (ChatGPT, Claude, etc.) need to check responses as they stream. Current implementation creates significant overhead:

- **Multiple API calls** for the same response (10-20 calls per message)
- **Redundant audit logs** for partial content
- **Performance bottlenecks** with AI-based rules
- **Poor user experience** when checks lag behind streaming

## Use Case

When a user interacts with ChatGPT:
1. User submits prompt: "Write Python code for data analysis"
2. ChatGPT starts streaming response
3. Plugin needs to check content in real-time
4. Currently sends: "Write...", "Write Python...", "Write Python code...", etc.
5. Each check creates an audit log entry
6. AI guardrails can't keep up with streaming speed

## Proposed API Enhancements

### Option 1: Streaming Session Management
```
POST /api/v1/stream-check/start
{
  "sessionId": "uuid",
  "context": { "userId": "...", "botId": "..." }
}

POST /api/v1/stream-check/update  
{
  "sessionId": "uuid",
  "content": "new content since last update",
  "position": 1234
}

POST /api/v1/stream-check/finish
{
  "sessionId": "uuid",
  "finalContent": "complete message",
  "createAuditLog": true
}
```

### Option 2: Client-Side Rule Distribution
```
GET /api/v1/rules/client-executable
{
  "fastRules": {
    "regex": [...],
    "keywords": [...],
    "checkpoints": ["sentence", "paragraph"]
  },
  "serverOnlyRules": ["ai-sentiment", "context-analysis"]
}
```

### Option 3: Differential Content Checking
```
POST /api/v1/check-content
{
  "messageId": "uuid",
  "previousContent": "last checked content",
  "currentContent": "new complete content",
  "deltaOnly": true
}
```

## Benefits

1. **Reduce API calls by 80-90%**
2. **Clean audit logs** (one entry per message, not per token)
3. **Better performance** for end users
4. **Enable sophisticated AI rules** without lag
5. **Lower infrastructure costs**

## Implementation Considerations

- Backward compatibility with existing plugins
- Session timeout handling
- Partial content storage requirements
- WebSocket option for bidirectional streaming

## Plugin Team Commitment

We're ready to:
- Beta test new endpoints
- Provide performance metrics
- Implement client-side rule execution
- Share learnings with other integration teams

## Related

- Plugin issue: virtualsteve-star/stinger-plugin#1
- Current plugin implementation: [response-monitor.ts](https://github.com/virtualsteve-star/stinger-plugin/blob/main/extension/src/content/interceptors/response-monitor.ts)