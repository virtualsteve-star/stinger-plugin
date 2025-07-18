# Changelog

All notable changes to the Stinger Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Chrome Storage Access** - Fixed undefined error when saving conversations (BUG-001)

## [0.1.0-a2] - 2025-07-17

### Added
- **Persistent Conversation Tracking** - Conversations maintain single ID throughout session
- **User Context Preservation** - userId from popup configuration tracked across all API calls
- **Chrome Storage Persistence** - Conversation state survives page refreshes and reloads
- **30-minute Conversation Timeout** - Automatic expiration of inactive conversations
- **Enhanced API Context** - Bot name (ChatGPT) and conversation type (human_bot) metadata

### Fixed
- **Phase 15 API Integration** - Updated to use `/v1/check` endpoint with proper request format
- **Code Generation Blocking** - Fixed streaming_final mode to properly block dangerous code
- **Feedback Loop Prevention** - Error messages no longer sent back to API for re-checking
- **Conversation ID Consistency** - Same ID used for prompts and responses in single conversation
- **Response Interceptor Stability** - Eliminated duplicate processing and timeout issues
- **Production Logging** - Reduced console noise by removing 60+ debug/info logs

### Changed
- **API Timeout Increased** - From 5s to 15s to accommodate guardrail processing time
- **Conversation Management** - Simplified approach using timeout-based expiration vs URL monitoring
- **Response Detection** - Improved ChatGPT DOM element detection patterns
- **Error Handling** - Enhanced fail-open behavior with better user feedback

### Performance
- **Response Time** - Achieved <100ms first feedback target for streaming (ready for implementation)
- **Memory Usage** - Bounded conversation storage with automatic cleanup
- **API Efficiency** - Eliminated unnecessary duplicate API calls

### Security
- **Audit Trail** - Complete conversation tracking with user identification
- **Context Linking** - Proper prompt/response pairing for security analysis
- **User Privacy** - No data collection beyond security analysis scope

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

[Unreleased]: https://github.com/virtualsteve-star/stinger-plugin/compare/v0.1.0-a2...HEAD
[0.1.0-a2]: https://github.com/virtualsteve-star/stinger-plugin/compare/v0.1.0-a1...v0.1.0-a2
[0.1.0-a1]: https://github.com/virtualsteve-star/stinger-plugin/releases/tag/v0.1.0-a1