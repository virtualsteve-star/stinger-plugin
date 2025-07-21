# BUG-003: Duplicate API Calls Creating Orphaned Conversations

**Status**: 🟢 **CLOSED - FIXED**  
**Priority**: High  
**Reported**: 2025-07-21  
**Fixed**: 2025-07-21  
**Reporter**: Core Engineering Team  
**Assignee**: Stinger-Plugin Team  

## Issue Description

The Chrome extension was making **3 API calls per user interaction instead of 2**, with the third call using a different conversation ID and missing the userId field. This created orphaned conversations and broke audit trail integrity.

### Symptoms Observed

1. **API Logs Showing**:
   - Call #1: ✅ Prompt check with `chrome_ext_1753117038750` + userId
   - Call #2: ✅ Response check with `chrome_ext_1753117038750` + userId  
   - Call #3: ❌ Response check with `chrome_ext_1753119019006` + NO userId → 400 Bad Request

2. **Server-Side Impact**:
   - 6 HTTP 400 responses per testing session
   - "missing_user_id" errors in API logs
   - Orphaned conversations with incomplete audit trails
   - 50% more API calls than necessary

3. **Browser-Side Impact**:
   - CORS prevented 400 errors from reaching browser console
   - Silent failures masked the underlying issue
   - Extension context invalidation errors during development

## Root Cause Analysis

**Duplicate Response Interceptors**: The extension had both legacy and new response checking systems running simultaneously:

```javascript
// In content/index.ts - BOTH were active:
responseMonitor = new ResponseMonitor(messageBus);        // Legacy - creating new conversation IDs
responseInterceptor = new ResponseInterceptor();         // Phase 15 - proper context
responseInterceptor.start();
```

### Technical Details

- **ResponseMonitor**: Legacy batch API system that created new timestamp-based conversation IDs for each response
- **ResponseInterceptor**: Phase 15 API system that reused conversation context from prompts
- **Timing**: Both fired within 100ms of each other, with ResponseMonitor lacking userId context

### Code Pattern Analysis

```javascript
// BAD: What ResponseMonitor was doing
const newConversationId = `chrome_ext_${Date.now()}`;  // New ID each time
const context = { conversation_id: newConversationId }; // No userId

// GOOD: What ResponseInterceptor was doing  
const context = await conversationManager.getApiContext(); // Reuse existing context
```

## Impact Assessment

### Business Impact
- **Audit Trail Integrity**: Orphaned responses couldn't be traced to users
- **Security Compliance**: Missing userId broke audit requirements  
- **Resource Waste**: 50% more API calls than needed
- **Rate Limiting**: Higher risk of hitting API limits

### Technical Impact
- **Debugging Complexity**: Multiple code paths made issues harder to trace
- **State Management**: Managing multiple conversations for single interactions
- **Error Handling**: Different error states from different interceptors

## Fix Implementation

### 1. Removed Duplicate ResponseMonitor

```javascript
// Before (BROKEN)
function setupResponseMonitoring() {
  responseMonitor = new ResponseMonitor(messageBus);        // Creates duplicate calls
  responseInterceptor = new ResponseInterceptor();         
  responseInterceptor.start();
}

// After (FIXED)  
function setupResponseMonitoring() {
  // Only use Phase 15 response interceptor (not legacy ResponseMonitor)
  // responseMonitor = new ResponseMonitor(messageBus);     // REMOVED
  responseInterceptor = new ResponseInterceptor();
  responseInterceptor.start();
}
```

### 2. Disabled Legacy DOM Observer Callbacks

```javascript
// Before (BROKEN)
onNewAssistantMessage: (text) => {
  if (responseMonitor) {
    responseMonitor.resetForNewMessage();
    responseMonitor.checkResponse(text);                   // Duplicate call
  }
}

// After (FIXED)
onNewAssistantMessage: (text) => {
  // Legacy response monitoring disabled - using ResponseInterceptor instead
}
```

### 3. Cleaned Up Debug Logging

Removed debug logs added during investigation:
- `checkInput called` in StingerClientV2.ts
- `Setup interception` in prompt-interceptor.ts  
- `Submit button clicked - intercepting` in prompt-interceptor.ts
- `Checking prompt with API` in prompt-interceptor.ts
- `New conversation created` in conversation-manager.ts

## Validation Results

### After Fix Applied
- ✅ **Exactly 2 API calls** per user interaction (1 prompt + 1 response)
- ✅ **Same conversation_id** for both calls  
- ✅ **userId present** in both calls
- ✅ **No 400 "missing_user_id" errors**
- ✅ **Core Engineering confirmed**: "logging is correct now"

### Test Scenarios Validated
1. **Simple question** → 2 calls total ✅
2. **Long streaming response** → 2 calls total ✅  
3. **Multiple questions** → 2 calls per question ✅
4. **Extension reload** → No orphaned conversations ✅

## Files Modified

- `extension/src/content/index.ts` - Removed ResponseMonitor initialization
- `extension/src/shared/api/StingerClientV2.ts` - Cleaned up debug logging
- `extension/src/content/interceptors/prompt-interceptor.ts` - Cleaned up debug logging  
- `extension/src/content/utils/conversation-manager.ts` - Cleaned up debug logging

## Prevention Measures

1. **Architecture Review**: Ensure single responsibility per interceptor type
2. **Integration Testing**: Add tests for API call counting  
3. **Monitoring**: Set up alerts for unexpected API usage patterns
4. **Code Reviews**: Flag any new response checking implementations

## Lessons Learned

1. **Legacy Code Removal**: Always fully disable old systems when introducing new ones
2. **API Usage Patterns**: Monitor actual vs expected API call volumes
3. **Error Visibility**: CORS can hide important debugging information
4. **Context Management**: Ensure conversation context is properly shared between components

---

**Resolution**: Fixed by removing duplicate ResponseMonitor and cleaning up legacy code paths. Chrome extension now maintains perfect audit trail integrity with proper conversation tracking.

**Validation**: Core Engineering team confirmed API logging is correct.

**Status**: 🟢 **CLOSED - FIXED**