# Stinger Guard Chrome Extension

[![CI](https://github.com/virtualsteve-star/stinger-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/virtualsteve-star/stinger-plugin/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.0--a3-blue)](https://github.com/virtualsteve-star/stinger-plugin/releases)
[![Stinger Compatible](https://img.shields.io/badge/Stinger-v0.1.0-a3a3-brightgreen)](https://github.com/virtualsteve-star/stinger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Chrome extension that provides real-time security guardrails for Large Language Model (LLM) interactions on web-based platforms. Now featuring **instant streaming security feedback** with <100ms response times!

## 🚀 Alpha Release v0.1.0-a3 - Enhanced API Integration

**⚡ NEW: Enhanced conversation tracking and code generation blocking!** This release features persistent conversation tracking, improved API integration, and working code generation detection with proper audit trails.

## Overview

Stinger Plugin is a Chrome Extension (Manifest V3) that monitors and enforces security policies for prompts and responses on LLM interfaces like ChatGPT and Microsoft Copilot. It integrates with the [Stinger](https://github.com/virtualsteve-star/stinger) policy engine to prevent sensitive data leakage and enforce enterprise security policies.

### Key Features (v0.1.0-a3)

- 🆕 **Persistent Conversation Tracking** - Single conversation ID maintained throughout session
- 🆕 **User Context Preservation** - User ID from popup tracked across all API calls
- 🆕 **Code Generation Blocking** - Working detection and blocking of dangerous code patterns
- 🆕 **Enhanced API Integration** - Updated to use `/v1/check` endpoint with proper format
- ✅ **Prompt Interception** - Captures prompts before submission on ChatGPT (Enter key & Submit button)
- ✅ **Real-time Security Checks** - Validates content against Stinger API guardrails
- ✅ **Response Monitoring** - Checks AI responses for policy violations
- ✅ **Audit Logging** - Complete conversation tracking with user identification
- ✅ **Chrome Storage Persistence** - Conversation state survives page refreshes
- ✅ **Graceful Fallback** - Fail-open behavior on API timeouts with user feedback

### What's New in v0.1.0-a3

#### 🔒 Enhanced Security & Tracking
- **Persistent conversation tracking** - Same ID for entire ChatGPT session
- **User audit trails** - Complete tracking of who's chatting with which bot
- **Code generation blocking** - Properly detects and blocks dangerous code patterns
- **Feedback loop prevention** - Error messages no longer sent back to API
- **Production-ready logging** - Clean console output with essential warnings only

### Coming Soon
- 🔜 API Authentication (Issue #4)
- 🔜 Enhanced retry logic (Issue #3)
- 🔜 Advanced error reporting (Issue #5)
- 🔜 LRU Cache optimization (Issue #6)
- 🔜 Comprehensive integration testing (Issue #7)

## Architecture

```
┌────────────────────┐            ┌───────────────────────────────┐
│   Content Script   │──────────▶│  Background Service Worker    │
│ (UI interception)  │  message  │  (config & storage)           │
│        +           │            └───────────────────────────────┘
│  Stinger API      │                          
│    Integration     │◀──────────────HTTP───────────────────────────┐
└─────────┬──────────┘                                              │
          │DOM mut.                                                 │
          ▼                                                         ▼
 Web page (ChatGPT)              Stinger API  ➜  Security Analysis
                                     (/v1/check)
```

## Documentation

- [Installation Guide](docs/installation-guide.md)
- [Technical Design Document](docs/stinger_chrome_extension_design.md)
- [Development Guide](CLAUDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Post-Release Roadmap](docs/plans/POST_RELEASE_ROADMAP.md)
- [SSE Streaming Integration Plan](docs/plans/SSE_STREAMING_INTEGRATION_PLAN.md)
- [Performance Validation Report](docs/SSE_PERFORMANCE_VALIDATION.md)

## Installation

### From Release (Recommended)
1. Download the latest release from [Releases](https://github.com/virtualsteve-star/stinger-plugin/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

### From Source
```bash
# Clone and build
git clone https://github.com/virtualsteve-star/stinger-plugin.git
cd stinger-plugin
npm install
npm run build

# Load the 'dist' folder in Chrome as above
```

## Requirements

- Chrome 118+ or Chromium-based browser
- Stinger API v0.1.0-a3+ with `/v1/check` endpoint
- API running on `http://localhost:8888` (or configured endpoint)
- Node.js 20+ and npm (for development only)

## Usage

1. **Install the extension** (see Installation above)
2. **Start the Stinger API**:
   ```bash
   # In the Stinger core repository
   python -m stinger.api
   ```
3. **Navigate to ChatGPT** (https://chatgpt.com)
4. **Start chatting** - The extension will automatically:
   - Intercept your prompts before submission
   - Check them against security policies
   - Show warnings or blocks for policy violations
   - Monitor AI responses for sensitive content

### Security Feedback Experience

#### Instant Pattern Detection (<100ms)
- **🟢 Allow**: Content instantly passes pattern checks
- **🟡 Warning**: Quick detection of potential issues with option to proceed
- **🔴 Block**: Immediate blocking of known policy violations

#### Progressive Analysis
- **🛡️ Security scanning...**: Shown after 500ms for complex analysis
- **Real-time updates**: See each security check as it completes
- **Transparent process**: No more "black box" waiting

## Development

```bash
# Building
npm run build        # Production build
npm run build:watch  # Development with auto-reload

# Testing
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
npm run ci          # Full validation suite

# Code Quality
npm run lint        # ESLint
npm run format      # Prettier
npm run typecheck   # TypeScript checking
```

## Repository Structure

```
/
├── docs/                    # Documentation
│   ├── plans/              # Phase execution plans
│   └── stinger_chrome_extension_design.md
├── extension/              # Chrome extension source
│   ├── src/               # TypeScript source files
│   │   ├── content/       # Content scripts
│   │   ├── background/    # Service worker
│   │   └── shared/        # Shared utilities
│   ├── assets/            # Icons and static files
│   └── manifest.json      # Chrome extension manifest
├── tests/                  # Test suites
│   ├── unit/              # Jest unit tests
│   └── e2e/               # Playwright tests
├── dist/                   # Built extension (git-ignored)
└── CLAUDE.md              # AI assistant guidance
```

## Testing

```bash
# Test the Stinger API connection
node tests/test-api.js

# Test conversation tracking
node tests/test-conversation.js

# Run all unit tests
npm test

# Run CI validation suite
npm run ci
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and standards
- Testing requirements
- Commit message format
- Pull request process

## Security

This extension is designed with security as the primary focus:
- All prompts/responses are hashed before local storage
- HTTPS with certificate pinning for API communication
- Minimal Chrome permissions requested
- Content Security Policy enforcement
- No remote code execution

## Support

- 🐛 [Report Issues](https://github.com/virtualsteve-star/stinger-plugin/issues)
- 📖 [View Documentation](docs/)
- 💬 [Discussions](https://github.com/virtualsteve-star/stinger-plugin/discussions)

## Roadmap

### ✅ Recently Completed
- ⚡ **SSE Streaming Integration** - Real-time security feedback (v0.1.0-a3)
- 🚀 **20x Performance Improvement** - <100ms first response
- 🎯 **Progressive UI Feedback** - Transparent security analysis

### 🔜 Next Priorities
See our [Post-Release Roadmap](docs/plans/POST_RELEASE_ROADMAP.md) for planned features:
- 🔐 API Authentication & Authorization (Issue #4)
- 🧪 Comprehensive Integration Testing (Issue #7)
- 🔄 Advanced Retry Logic (Issue #3)
- 📊 Enhanced Error Reporting (Issue #5)
- ⚡ LRU Cache Optimizations (Issue #6)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Stinger Team**