# BUG-001: Chrome Storage Undefined Error in Conversation Store

**Status**: CLOSED  
**Priority**: High  
**Component**: Content Script / Storage  
**Reported**: 2025-07-18  
**Fixed**: 2025-07-18  

## Description

The conversation store was failing to save conversation data with the error:
```
Failed to save conversation: TypeError: Cannot read properties of undefined (reading 'local')
```

This error appeared in the Chrome extension console when the extension tried to create and save a new conversation.

## Root Cause

The `ConversationStore` class was incorrectly using `ChromeWrapper` as an instance:
```typescript
private chrome = new ChromeWrapper();
// Later...
await this.chrome.storage.local.get(STORAGE_KEY);
```

However, `ChromeWrapper` provides static methods, not instance methods. The `storage` property is defined as a static property on the class.

## Impact

- Conversation tracking was not persisted across page refreshes
- Conversation IDs were regenerated on each page load
- User context and conversation history were lost

## Fix

Changed all ChromeWrapper usage from instance to static method calls:

```typescript
// Before:
await this.chrome.storage.local.get(STORAGE_KEY);
await this.chrome.storage.local.set({...});
await this.chrome.storage.local.remove(STORAGE_KEY);

// After:
await ChromeWrapper.storage.get(STORAGE_KEY);
await ChromeWrapper.storage.set({...});
await ChromeWrapper.storage.remove(STORAGE_KEY);
```

## Files Changed

- `/extension/src/content/utils/conversation-store.ts`

## Verification

After the fix:
- No more "Failed to save conversation" errors in console
- Conversation IDs are properly persisted
- Chrome storage operations work correctly

## Related Issues

- Also investigated a mysterious "Creating NEW conversation" warning that appears to be from the build process (harmless, low priority)