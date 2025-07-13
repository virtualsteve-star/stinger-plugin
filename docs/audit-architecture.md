# Stinger Plugin Audit Architecture

## Overview

The Stinger Plugin follows a **centralized audit logging** architecture. The plugin does NOT store audit events locally - all audit logging is handled by the Stinger backend service.

## Audit Flow

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐      ┌──────────────┐
│  Chrome Plugin  │      │  Stinger API     │      │ Stinger Backend │      │     SIEM     │
│  (on laptop)    │─────▶│  (centralized)   │─────▶│  Audit Storage  │─────▶│  (external)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘      └──────────────┘
       │                          │                          │
       │ 1. Send prompt/         │ 2. Check guardrails     │ 3. Store audit
       │    response             │    Return decision       │    events
       │                         │    Log to backend        │
       ▼                         ▼                          ▼
   No local storage         Policy decisions           Centralized logs
```

## Key Principles

1. **No Local Audit Storage**: The plugin does NOT maintain an audit queue or store audit events locally
2. **Real-time Transmission**: All prompts and responses are sent immediately to the Stinger API
3. **Backend Responsibility**: The Stinger backend service handles all audit logging, storage, and SIEM integration
4. **Performance Caching Only**: The plugin only caches rules and API responses for performance, not audit data

## What the Plugin Stores Locally

The plugin uses Chrome's local storage ONLY for:

- **Configuration**: API URL, tenant ID, user ID, settings
- **Cached Rules**: Policy rules for offline operation (with TTL)
- **Response Cache**: Recent API responses for performance (with TTL)

## What the Plugin Does NOT Store

- ❌ Audit events
- ❌ Prompt/response history
- ❌ User activity logs
- ❌ Security event queue

## API Communication

When intercepting ChatGPT traffic:

```typescript
// 1. Plugin intercepts prompt
const prompt = captureFromDOM();

// 2. Send to API immediately
const result = await stingerClient.checkContent({
  text: prompt,
  kind: 'prompt',
  tenantId: config.tenantId,
  userId: config.userId
});

// 3. API returns decision AND logs audit event internally
// Plugin only acts on the decision (allow/warn/block)
```

## Benefits of Centralized Audit

1. **Compliance**: All audit logs in one secure location
2. **No Data Leakage**: Sensitive prompts not stored on user devices
3. **Simplified SIEM**: Direct backend-to-SIEM integration
4. **Reduced Complexity**: Plugin focuses on interception, not storage
5. **Storage Efficiency**: No Chrome storage quota issues

## Storage Service Role

The `StorageService` in the plugin is responsible for:

- Managing extension configuration
- Caching API responses for performance
- Storing policy rules for offline decisions
- **NOT storing audit events**

## Migration Note

Early designs incorrectly included local audit queuing. This has been removed in favor of the centralized architecture described above.