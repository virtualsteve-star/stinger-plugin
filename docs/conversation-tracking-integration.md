# Conversation Tracking Integration

## Overview

The Stinger Plugin now includes full conversation tracking to provide complete accountability and traceability for every security decision. This enhancement ensures audit logs show exactly WHO was involved in each conversation.

## Implementation Details

### 1. User Identification

The plugin attempts to identify users through multiple methods:

1. **Configured User ID**: If set in extension settings (`config.userId` and `config.userName`)
2. **Chrome Identity API**: Retrieves the logged-in Chrome user's email
3. **Anonymous ID**: Falls back to a generated anonymous ID if no user info is available

### 2. Bot Detection

The plugin automatically detects which AI system is being used:

- **ChatGPT**: Detected via hostname `chat.openai.com`
  - Model detection from UI elements (GPT-4, GPT-3.5-turbo)
- **Future**: Extensible to support Claude, Bard, etc.

### 3. Session Tracking

Each browser tab session gets a unique session ID to track related checks:
- Format: `ext-{timestamp}-{random}`
- Persists for the lifetime of the content script

### 4. Context Included in API Calls

Every check request now includes:

```javascript
{
  text: "prompt or response text",
  kind: "prompt" | "response",
  context: {
    // Required
    userId: "bob@example.com",
    botId: "chatgpt",
    
    // Participant types (NEW)
    userType: "human",     // human | bot | agent | ai_model
    botType: "ai_model",   // human | bot | agent | ai_model
    
    // Optional but included
    userName: "Bob Smith",
    botName: "ChatGPT",
    botModel: "gpt-4",
    sessionId: "ext-1736635968074-abc123",
    
    // Metadata
    browser: "Chrome",
    extensionVersion: "0.1.0",
    url: "chat.openai.com"
  }
}
```

## Audit Log Enhancement

Before:
```
User checked prompt: "How do I hack the system?"
Decision: Blocked
```

After (with user/bot identification):
```
bob@example.com <-> ChatGPT checked prompt: "How do I hack the system?"
Decision: Blocked
```

After (with participant types):
```
bob@example.com (human) <-> ChatGPT (ai_model) checked prompt: "How do I hack the system?"
Decision: Blocked
```

## Privacy Considerations

- User identification is optional - users can remain anonymous
- No personal data is stored locally - only sent to the Stinger API
- All audit logging happens on the backend for centralized security

## Configuration

Users can set their identity in the extension settings:
- `userId`: Email or unique identifier
- `userName`: Display name for audit logs

If not configured, the extension will:
1. Try to use Chrome profile email (requires user consent)
2. Fall back to anonymous tracking

## Participant Type Detection

The extension automatically detects participant types:

### User Type Detection:
- **Human** (default): Regular users interacting with AI
- **Bot**: Detected via URL parameters (`automated=true`) or DOM indicators
- **Agent**: Detected via URL parameters (`agent=true`) or agent-specific UI elements

### Bot Type Detection:
- **ai_model**: Standard AI systems like ChatGPT, Claude (default)
- **agent**: AI agents like AutoGPT (detected by hostname patterns)
- **bot**: Customer service or support bots
- **human**: For reverse scenarios where a bot is talking to a human

### Example Scenarios:
1. **Human → AI Model**: `alice@company.com (human) <-> chatgpt (ai_model)`
2. **Bot → Human**: `helpdesk-bot-1 (bot) <-> customer-12345 (human)`
3. **Agent → Agent**: `research-agent (agent) <-> writing-agent (agent)`
4. **Agent → AI Model**: `orchestrator-agent (agent) <-> gpt-4 (ai_model)`

## Benefits

1. **Accountability**: Know exactly which user triggered which guardrail
2. **Debugging**: Quickly identify problematic user/AI combinations
3. **Analytics**: Track usage patterns per user and AI system
4. **Compliance**: Meet audit requirements for user attribution
5. **Support**: Help users by seeing their exact conversation context
6. **Loop Detection**: Identify when AI systems are talking to each other
7. **Smart Filtering**: Apply different rules based on conversation type