# Changelog

All notable changes to the Stinger Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-a1] - 2025-07-13

### Added

#### Core Extension Features
- **Chrome Extension Manifest V3** implementation with service worker architecture
- **Prompt Interception** for ChatGPT on both Enter key and Submit button
- **Real-time Security Checking** via Stinger API integration
- **User Interface Overlays** for security warnings and blocks with proceed/cancel options
- **Conversation Tracking** with participant type detection (human/bot/agent/ai_model)
- **Content Security Policy** enforcement and audit logging

#### API Integration
- **Stinger API Client** with timeout handling and retry logic
- **Health Check Endpoint** monitoring for API availability
- **Rules Synchronization** with local caching and fallback
- **Request/Response Caching** with TTL-based invalidation
- **Error Handling** with graceful degradation (fail-open on API timeout)

#### Infrastructure
- **Message Bus System** for type-safe communication between content scripts and background worker
- **Storage Service** with Chrome storage abstraction and quota management
- **Structured Logging** with different levels and console output
- **Chrome API Wrappers** with promise-based interfaces and error handling

#### Developer Experience
- **TypeScript 5** with strict type checking and ES2022 target
- **Vite Build System** with @crxjs/vite-plugin for Chrome extension bundling
- **Jest Unit Testing** with Chrome API mocks and 100% pass rate
- **ESLint + Prettier** code quality and formatting
- **GitHub Actions CI/CD** with cross-platform testing (Ubuntu, Windows, macOS)

#### Security Features
- **Input Validation** with size limits and sanitization
- **Memory Leak Prevention** with proper cleanup of intervals and observers
- **DOM Manipulation Safety** using WeakSet tracking without modifying elements
- **CSP Compliance** with no eval usage and minimal permissions

### Technical Details

#### Supported Platforms
- **ChatGPT** (chatgpt.com) with full prompt interception support
- **Chrome Extension API** Manifest V3 compliance
- **Cross-platform CI** testing on Node.js 20.x and 22.x

#### Architecture Components
- **Content Script** (`extension/src/content/`) - Handles ChatGPT integration
- **Background Service Worker** (`extension/src/background/`) - API communication and storage
- **Shared Libraries** (`extension/src/shared/`) - Common utilities and types
- **Test Suite** (`tests/`) - Unit tests and API validation scripts

#### Performance Characteristics
- **API Response Time**: <2000ms timeout with retry logic
- **Memory Usage**: Bounded with LRU-style caching
- **UI Responsiveness**: Non-blocking prompt checks with loading states

### Developer Notes

#### Known Limitations
- **Single Platform**: Currently supports ChatGPT only
- **Basic Cache**: Simple TTL-based caching without LRU eviction
- **No Authentication**: API calls use hardcoded localhost endpoint
- **Limited Error Reporting**: Basic error handling without telemetry

#### Post-Release Roadmap
- 5 detailed RFEs filed for future enhancements (Issues #3-#7)
- Estimated 21-29 days of additional development across 3 sprints
- Focus areas: Authentication, Testing Framework, Performance, Observability

[Unreleased]: https://github.com/virtualsteve-star/stinger-plugin/compare/v0.1.0-a1...HEAD
[0.1.0-a1]: https://github.com/virtualsteve-star/stinger-plugin/releases/tag/v0.1.0-a1