# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stinger Guard is a Chrome Extension (Manifest V3) that monitors and enforces security guardrails for prompts and responses on ChatGPT. This MVP implementation intercepts LLM traffic and routes it to the Stinger API for audit logging and policy enforcement.

### Current Status
- ✅ Phase 1 Complete: Project setup with TypeScript, Vite, Jest, and Chrome extension structure
- ✅ Phase 2 Complete: Core infrastructure (messaging, storage, API client, logging)
- 🚧 Phase 3 Next: Content Script Development for ChatGPT integration
- MVP Focus: ChatGPT only, basic allow/warn/block functionality

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
npm run lint            # ESLint on extension/src (currently requires legacy config)
npm run format          # Prettier formatting
npm run typecheck       # TypeScript type checking

# CI Pipeline (without linting due to ESLint v9 config issues)
npm run typecheck && npm run test && npm run build

# Loading in Chrome
1. Run `npm run build`
2. Open chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` directory
```

## Test the Stinger API Connection

```bash
# Ensure Stinger API is running on port 8888
node test-api.js        # Test API endpoints
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
- `tests/` - Test files
- `test-api.js` - Stinger API validation script
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
   - Manual testing: Visit https://chat.openai.com
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

## Next Steps (Phase 3)

1. **Content Script Development**
   - Implement ChatGPT DOM monitoring
   - Intercept prompt submission
   - Monitor response streaming
   - Add UI feedback components

2. **Background Worker Integration**
   - Connect content script to API
   - Implement audit queue processing
   - Add alarm-based syncing