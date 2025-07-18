# BUG-002: Anonymous User Orphaned Responses

**Status**: CLOSED  
**Priority**: Critical  
**Component**: Content Script / Conversation Management  
**Reported**: 2025-07-18 (by Core Engineering Team)  
**Fixed**: 2025-07-18  

## Description

The Chrome extension was creating orphaned audit log entries where LLM responses were logged with userId "anonymous" but no corresponding user prompts existed. This created incomplete audit trails and broken conversation tracking.

## Root Cause

The response interceptor could create a new conversation context when checking responses, even if no prompt had been sent yet. This happened when:

1. ChatGPT page loaded with existing messages
2. Response interceptor detected these messages and called `getApiContext()`
3. This created a NEW anonymous conversation because no prompt had been sent
4. Later prompts used the proper userId from popup configuration
5. Result: Multiple conversation IDs and orphaned anonymous entries

## Impact

- **Incomplete audit trails** - Missing user prompts for anonymous entries
- **Broken conversation tracking** - Cannot reconstruct full conversation flow
- **UEBA scoring issues** - Anonymous actions not properly attributed
- **Compliance concerns** - Incomplete audit logs for security reviews

## Fix

Added check to prevent response interceptor from creating new conversations:

```typescript
// In response-interceptor.ts
if (!conversationManager.hasActiveConversation()) {
  logger.info('Skipping response check - no active conversation with prompts');
  return;
}

// In conversation-manager.ts
hasActiveConversation(): boolean {
  return this.currentConversation !== null && 
         this.currentConversation.lastPromptTime !== undefined;
}
```

Also added debug logging to track context lifecycle:
- Recording prompt in conversation
- Recording response in conversation  
- Generated API context

## Files Changed

- `/extension/src/content/interceptors/response-interceptor.ts`
- `/extension/src/content/utils/conversation-manager.ts`

## Verification

After the fix:
- Response checks only occur after a prompt has been sent
- All API calls use consistent userId and conversationId
- No orphaned anonymous entries in audit logs
- Complete conversation flow tracking

## Test Cases

1. **Page load with existing messages**: Verify no API calls until user sends prompt
2. **Anonymous user flow**: Verify consistent anonymous ID across all events
3. **Authenticated user flow**: Verify userId consistency throughout conversation
4. **Multi-turn conversation**: Verify single conversation ID maintained