# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stinger Guard is a Chrome Extension (Manifest V3) that monitors and enforces security guardrails for prompts and responses on ChatGPT. This MVP implementation intercepts LLM traffic and routes it to the Stinger API for audit logging and policy enforcement.

### Current Status
- ✅ Phase 1 Complete: Project setup with TypeScript, Vite, Jest, and Chrome extension structure
- ✅ Phase 2 Complete: Core infrastructure (messaging, storage, API client, logging)
- ✅ Phase 3 Complete: Content Script Development for ChatGPT integration
- ✅ **MVP Complete**: Working Chrome extension with prompt interception, API integration, and UI
- ✅ CI/CD Pipeline: GitHub Actions with cross-platform testing and quality checks
- ✅ Post-Release Planning: 5 detailed RFEs filed for future enhancements

## Development Commands

```bash
# Install dependencies (auto-builds extension)
npm install

# Development
npm run dev              # Start Vite dev server
npm run build:watch      # Rebuild on file changes

# Building
npm run build           # Production build to dist/

# Testing
npm run test            # Run Jest unit tests (with typecheck pre-check)
npm run test:watch      # Jest in watch mode
npm run test:e2e        # Run Playwright E2E tests

# Code Quality
npm run lint            # ESLint on extension/src
npm run format          # Prettier formatting
npm run typecheck       # TypeScript type checking

# CI Pipeline
npm run ci              # Full validation (typecheck, lint, test, build)

# Loading in Chrome
1. Run `npm run build`
2. Open chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` directory
```

## Quick Build & Test

When making changes to the extension:
```bash
# Build the extension
npm run build

# Then reload in Chrome:
# 1. Go to chrome://extensions/
# 2. Find "Stinger Guard Plugin"
# 3. Click the refresh/reload icon
```

## Test the Stinger API Connection

```bash
# Ensure Stinger API is running on port 8888
node tests/test-api.js        # Test API endpoints
node tests/test-conversation.js  # Test conversation tracking
```

## Architecture Overview

The extension consists of three main components:

1. **Content Script** (`extension/content.ts`)
   - Injected into target LLM websites (ChatGPT, Copilot)
   - Intercepts user prompts before submission
   - Monitors DOM for model responses
   - Implements UI for warnings/blocks/redactions

2. **Background Service Worker** (`extension/bg.ts`)
   - Handles communication with Stinger Policy API
   - Manages audit logging and SIEM integration
   - Performs policy synchronization
   - Uses Chrome storage for queuing events

3. **Stinger Policy API** (External microservice)
   - Evaluates prompts/responses against security policies
   - Returns verdicts: allow/warn/block
   - Provides centralized policy management

## Key Technical Decisions

- **TypeScript 5** with ES2022 target
- **Vite** with @crxjs/vite-plugin for Chrome extension bundling
- **Chrome Extension Manifest V3** (service workers, not background pages)
- **Jest** for unit testing with Chrome API mocks
- **Playwright** for E2E testing
- **Security-first design**: CSP hardening, isolated worlds, no eval
- **Performance targets**: <250ms p95 for policy checks (MVP: <500ms)

## Important Files and Locations

- `extension/` - Chrome extension source code
  - `manifest.json` - Extension configuration
  - `src/content/` - Content scripts (run on ChatGPT)
  - `src/background/` - Service worker
  - `src/shared/` - Shared types and utilities
- `dist/` - Built extension (git-ignored, load this in Chrome)
- `tests/` - Test files and scripts
  - `test-api.js` - Stinger API validation script
  - `test-conversation.js` - Conversation tracking test
  - `unit/` - Jest unit tests
- `docs/plans/` - Planning documents and roadmaps
- `.env` - Local environment configuration

## Development Workflow

1. **Starting Development**
   ```bash
   # Terminal 1: Start Stinger API (in stinger core repo)
   # Terminal 2: Start build watcher
   npm run build:watch
   ```

2. **Making Changes**
   - Edit files in `extension/src/`
   - Build automatically updates
   - Reload extension in Chrome (or use Extensions Reloader extension)

3. **Testing Changes**
   - Unit tests: `npm test`
   - API tests: `node tests/test-api.js`
   - Conversation tracking: `node tests/test-conversation.js`
   - Manual testing: Visit https://chatgpt.com
   - Check console for "Stinger Guard:" messages

4. **Before Committing**
   - Run `npm run ci` to ensure all checks pass
   - Test the built extension manually

## Security Considerations

- All prompts/responses are hashed locally before storage
- HTTPS with device certificates for API communication
- Minimal Chrome permissions (no tab access, cookies, or file URLs)
- Policy rules are signed with HMAC-SHA256
- Fallback to "warn" mode on API timeout (>2s)

## Phase 2 Completed Features

### Core Infrastructure ✅
- **Message Bus**: Type-safe message passing between content scripts and background worker
- **Storage Service**: Abstraction layer for Chrome storage with caching and quota management
- **API Client**: Stinger API client with retry logic and response caching
- **Logging System**: Structured logging with different levels and buffering
- **Type System**: Complete TypeScript types for messages, API, and storage
- **Error Handling**: Centralized error handling with proper Chrome API error management
- **Chrome Wrapper**: Safe wrappers for Chrome APIs with promise support

### Testing Infrastructure ✅
- Unit tests for all core components
- Chrome API mocks for testing
- 100% test passing rate

## Post-Release Roadmap

See `docs/plans/POST_RELEASE_ROADMAP.md` for detailed implementation plan with 5 filed RFEs:

1. **Issue #4: API Authentication** (High Priority, 5-7 days)
   - JWT token management and secure API communications

2. **Issue #7: Integration Testing Framework** (High Priority, 7-10 days) 
   - End-to-end testing with Chrome extension lifecycle

3. **Issue #3: Comprehensive Retry Logic** (Medium Priority, 2-3 days)
   - Exponential backoff and circuit breaker patterns

4. **Issue #6: LRU Cache Eviction** (Medium Priority, 3-4 days)
   - Bounded memory usage and cache optimization

5. **Issue #5: Enhanced Error Reporting** (Medium Priority, 4-5 days)
   - Structured telemetry and user-friendly error messages

**Total Estimated Effort**: 21-29 days across 3 development sprints

## Agent Communication System

### Your Role: Stinger-Plugin Team Agent

You are the official AI agent representing the **Stinger-Plugin Team** in the inter-agent communication system. You have responsibilities for monitoring and responding to messages from other teams.

### AgentMail System

The `AgentMail/` folder contains an asynchronous messaging system for communication between autonomous agent teams:

- **Location**: `/AgentMail/` in the project root
- **Your Inbox**: `/AgentMail/stinger-plugin/` - Check for new messages here
- **Message Format**: Markdown files with From/To/Subject/Timestamp headers

### Team Folders

- `stinger-core/` - Send messages here for Core development team
- `stinger-qa/` - Send messages here for QA team  
- `stinger-plugin/` - Your inbox (monitor for incoming messages)
- `stinger-eng/` - Engineering team folder

### Communication Protocol

1. **Check for Messages**: Look in `/AgentMail/stinger-plugin/` for new `.md` files
2. **Read and Analyze**: Parse the From/To/Subject headers and message content
3. **Respond Appropriately**: Create a response file in the sender's folder
4. **Use Standard Format**:
   ```markdown
   From: stinger-plugin
   To: [recipient-team]
   Subject: [descriptive subject]
   Timestamp: [ISO 8601 timestamp]
   
   ---
   
   [Your message content in markdown]
   
   – Plugin Team
   ```

### Your Responsibilities

As the Plugin Team Agent:
- Monitor incoming messages about plugin architecture, integration, and testing
- Provide updates on plugin development status and roadmap
- Collaborate with QA team on test planning and quality assurance
- Coordinate with Core team on API changes and compatibility
- Share technical decisions and request reviews when needed

### Current Status to Communicate

- **Version**: v0.1.0-a1 (Alpha Release)
- **Status**: MVP Complete, 5 RFEs filed for post-release
- **CI/CD**: All checks passing, clean builds
- **Testing**: 30 passing tests, 35 skipped (tracked in Issue #8)
- **Next Focus**: API Authentication (Issue #4) and Testing Framework (Issue #7)