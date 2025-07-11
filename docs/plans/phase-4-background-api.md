# Phase 4: Background Worker & API Integration (MVP)

**Duration:** Week 4 (5 days)  
**Status:** Not Started  
**Dependencies:** Phase 3 completion

## Overview

This phase implements the background service worker that handles API communication with Stinger. MVP focus: reliable message passing between content script and API, with basic state management.

## Goals

1. Implement message passing between content script and background
2. Create Stinger API client in background worker
3. Handle API responses and relay to content script
4. Add basic logging for debugging
5. Keep architecture simple but extensible

## Implementation Tasks

### Day 1: Background Worker Setup

#### Morning (4 hours)
- [ ] Create background service worker
  ```typescript
  // src/background/index.ts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle messages from content script
  });
  ```
- [ ] Set up message types and handlers
- [ ] Test basic communication
- [ ] Add manifest configuration

#### Afternoon (4 hours)
- [ ] Implement message routing
- [ ] Create response handling
- [ ] Add basic error handling
- [ ] Test with content script

### Day 2: API Client Implementation

#### Morning (4 hours)
- [ ] Create simple Stinger API client
  ```typescript
  // src/background/api.ts
  class StingerAPI {
    async checkContent(text: string, kind: 'prompt' | 'response') {
      return fetch(`${API_URL}/v1/check`, {
        method: 'POST',
        body: JSON.stringify({ text, kind })
      });
    }
  }
  ```
- [ ] Add configuration management
- [ ] Implement timeout handling (2s)
- [ ] Create retry logic (1 retry)

#### Afternoon (4 hours)
- [ ] Test API integration
- [ ] Handle different response types
- [ ] Add basic request queuing
- [ ] Implement error responses

### Day 3: State Management

#### Morning (4 hours)
- [ ] Track active tabs
- [ ] Store API configuration
- [ ] Manage pending requests
- [ ] Handle tab closing/navigation

#### Afternoon (4 hours)
- [ ] Implement simple caching
- [ ] Add request deduplication
- [ ] Create state persistence
- [ ] Test state scenarios

### Day 4: Logging & Debugging

#### Morning (4 hours)
- [ ] Create simple logging system
- [ ] Log all API requests/responses
- [ ] Add performance timing
- [ ] Create debug mode

#### Afternoon (4 hours)
- [ ] Add Chrome storage for logs
- [ ] Implement log rotation
- [ ] Create log export function
- [ ] Test logging system

### Day 5: Integration Testing

#### Morning (4 hours)
- [ ] Test full flow: content → background → API
- [ ] Verify message passing reliability
- [ ] Test error scenarios
- [ ] Check memory usage

#### Afternoon (4 hours)
- [ ] Fix integration issues
- [ ] Optimize performance
- [ ] Document API usage
- [ ] Prepare for next phase

## Testing Requirements

### Core Functionality Tests
- [ ] Message passing works reliably
- [ ] API calls succeed
- [ ] Timeout handling works
- [ ] Errors propagate correctly

### Integration Tests
- [ ] Content script ↔ background flow
- [ ] API integration end-to-end
- [ ] Multi-tab scenarios
- [ ] Service worker lifecycle

## Deliverables

1. **Working Background Worker**
   - Handles messages from content script
   - Manages API communication
   - Simple but reliable

2. **API Integration**
   - Connects to Stinger API
   - Handles timeouts and errors
   - Basic retry logic

3. **Basic State Management**
   - Tracks active connections
   - Simple caching
   - Configuration storage

4. **Debugging Tools**
   - Logging system
   - Performance metrics
   - Debug mode

## Success Criteria

- [ ] Messages reliably passed between components
- [ ] API calls complete successfully
- [ ] Timeouts handled gracefully
- [ ] No memory leaks
- [ ] Easy to debug issues

## Out of Scope (Future Phases)

- Complex state management
- Advanced caching strategies
- Offline support
- Batch API requests
- Advanced retry logic
- Performance optimizations

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Service worker termination | High | Keep operations stateless where possible |
| API latency | Medium | 2s timeout with fallback |
| Message ordering | Low | Simple queue for MVP |

## Notes

- Service workers can be terminated by Chrome
- Keep background operations lightweight
- Don't store sensitive data in background
- Focus on reliability over features
- Document all API interactions