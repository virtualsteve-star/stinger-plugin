# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stinger Guard is a Chrome Extension (Manifest V3) that monitors and enforces security guardrails for prompts and responses on web-based LLM interfaces like ChatGPT and Microsoft Copilot. This is currently a greenfield project in the planning phase with a comprehensive technical design document.

## Development Commands

Since the project is not yet initialized, these commands will be available after setup:

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Run unit tests
npm run test
npm run test:watch  # Watch mode

# Run E2E tests
npm run test:e2e

# Lint and typecheck
npm run lint
npm run typecheck

# Package extension for Chrome
npm run package  # Creates .crx file
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
- **Vite** for bundling (targeting Chrome 118+)
- **Chrome Extension Manifest V3** (service workers, not background pages)
- **Security-first design**: CSP hardening, isolated worlds, no eval
- **Performance targets**: <250ms p95 for policy checks

## Project Structure (To Be Implemented)

```
/extension/
  manifest.json    # Chrome extension manifest
  content.ts       # Content script for DOM interaction
  bg.ts           # Background service worker
  logger.ts       # Logging utilities
  rpc.ts          # API communication with retries
  hash.ts         # SHA-256 cryptographic utilities
/tests/
  unit/           # Jest unit tests
  e2e/            # Playwright E2E tests
```

## Security Considerations

- All prompts/responses are hashed locally before storage
- HTTPS with device certificates for API communication
- Minimal Chrome permissions (no tab access, cookies, or file URLs)
- Policy rules are signed with HMAC-SHA256
- Fallback to "warn" mode on API timeout (>2s)

## Current Status

The project has a detailed technical design (`stinger_chrome_extension_design.md`) but no implementation yet. Next steps:
1. Initialize npm project and TypeScript configuration
2. Set up Vite bundler for Chrome extension
3. Create manifest.json for Manifest V3
4. Implement core components
5. Set up testing infrastructure