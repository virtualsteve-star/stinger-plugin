# Phase 3: Content Script Development (MVP)

**Duration:** Week 3 (5 days)  
**Status:** Not Started  
**Dependencies:** Phase 2 completion

## Overview

This phase focuses on developing a minimal content script for ChatGPT that proves we can intercept LLM traffic and route it to Stinger. MVP focus: capture prompts/responses and demonstrate basic guardrail functionality.

## Goals

1. Implement basic prompt interception for ChatGPT
2. Capture responses from ChatGPT
3. Send all traffic to Stinger API
4. Show basic allow/warn/block functionality
5. Keep implementation simple and testable

## Implementation Tasks

### Day 1: Basic ChatGPT Integration

#### Morning (4 hours)
- [ ] Create minimal ChatGPT configuration
  ```typescript
  // src/content/chatgpt.ts
  const SELECTORS = {
    textInput: '#prompt-textarea',
    sendButton: 'button[data-testid="send-button"]',
    responseContainer: 'div[data-message-author-role="assistant"]'
  }
  ```
- [ ] Implement basic DOM element detection
- [ ] Set up content script injection
- [ ] Test element selection on ChatGPT

#### Afternoon (4 hours)
- [ ] Create simple prompt capture
- [ ] Implement send button interception
- [ ] Extract prompt text
- [ ] Test with various prompt types

### Day 2: Response Monitoring

#### Morning (4 hours)
- [ ] Set up basic MutationObserver
- [ ] Detect new response elements
- [ ] Extract response text (ignore streaming for MVP)
- [ ] Handle response completion

#### Afternoon (4 hours)
- [ ] Test response capture accuracy
- [ ] Handle code blocks and formatting
- [ ] Create simple response queue
- [ ] Add basic error handling

### Day 3: API Integration

#### Morning (4 hours)
- [ ] Connect to Stinger API from content script
- [ ] Send prompts to `/v1/check` endpoint
- [ ] Handle API responses (allow/warn/block)
- [ ] Implement basic retry logic

#### Afternoon (4 hours)
- [ ] Add timeout handling (2s fallback to warn)
- [ ] Test with various content types
- [ ] Log all interactions for debugging
- [ ] Handle API errors gracefully

### Day 4: Basic UI Feedback

#### Morning (4 hours)
- [ ] Create minimal UI for block action
  - Clear textarea
  - Show simple alert/notification
- [ ] Implement warning banner
  - Non-intrusive yellow banner
  - Allow user to proceed
- [ ] Style to match ChatGPT UI

#### Afternoon (4 hours)
- [ ] Test UI interactions
- [ ] Ensure UI doesn't break ChatGPT
- [ ] Handle edge cases (multiple warnings, etc.)
- [ ] Create simple user messages

### Day 5: Testing & Polish

#### Morning (4 hours)
- [ ] Create basic test suite
- [ ] Test prompt interception reliability
- [ ] Verify API communication
- [ ] Check memory usage

#### Afternoon (4 hours)
- [ ] Fix any critical bugs
- [ ] Document setup and usage
- [ ] Create demo scenarios
- [ ] Prepare for next phase

## Testing Requirements

### Core Functionality Tests
- [ ] Prompt capture works 100% of the time
- [ ] Response capture is accurate
- [ ] API communication is reliable
- [ ] Block/warn actions work correctly

### Basic E2E Tests
- [ ] Complete conversation flow
- [ ] API timeout handling
- [ ] Error recovery
- [ ] Page refresh handling

## Deliverables

1. **Working Content Script**
   - Captures ChatGPT prompts
   - Monitors responses
   - Minimal, focused code

2. **API Integration**
   - Sends content to Stinger
   - Handles responses
   - Basic error handling

3. **Simple UI Feedback**
   - Block notification
   - Warning banner
   - Matches ChatGPT style

4. **Basic Documentation**
   - How it works
   - Setup instructions
   - Known limitations

## Success Criteria

- [ ] Successfully intercepts all ChatGPT prompts
- [ ] Captures complete responses
- [ ] Sends data to Stinger API
- [ ] Shows block/warn feedback to user
- [ ] No significant performance impact
- [ ] Works reliably for demo purposes

## Out of Scope (Future Phases)

- Advanced error handling
- Streaming response support
- Multi-site support
- Enterprise features
- Offline mode
- Advanced UI components
- Performance optimizations

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ChatGPT selector changes | High | Use multiple selector strategies |
| API timeouts | Medium | Fallback to warn mode |
| Performance issues | Low | Keep implementation minimal |

## Notes

- Focus on proving the concept works
- Don't over-engineer solutions
- Keep code simple and readable
- Document assumptions and limitations
- Prepare list of enhancements for future phases