# Stinger Guard Chrome Extension

[![CI](https://github.com/virtualsteve-star/stinger-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/virtualsteve-star/stinger-plugin/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.0--a1-blue)](https://github.com/virtualsteve-star/stinger-plugin/releases)
[![Stinger Compatible](https://img.shields.io/badge/Stinger-v0.1.0a3-brightgreen)](https://github.com/virtualsteve-star/stinger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Chrome extension that provides real-time security guardrails for Large Language Model (LLM) interactions on web-based platforms.

## 🚀 Alpha Release v0.1.0-a1

The Stinger Guard Chrome Extension is now available as an alpha release! This MVP provides core functionality for intercepting and checking prompts on ChatGPT with the Stinger API.

## Overview

Stinger Plugin is a Chrome Extension (Manifest V3) that monitors and enforces security policies for prompts and responses on LLM interfaces like ChatGPT and Microsoft Copilot. It integrates with the [Stinger](https://github.com/virtualsteve-star/stinger) policy engine to prevent sensitive data leakage and enforce enterprise security policies.

### Key Features (v0.1.0-a1)

- ✅ **Prompt Interception** - Captures prompts before submission on ChatGPT (Enter key & Submit button)
- ✅ **Real-time Security Checks** - Validates content against Stinger API guardrails
- ✅ **User Interface** - Shows warnings/blocks with allow/deny options
- ✅ **Conversation Tracking** - Tracks participant types (human/bot/agent/ai_model)
- ✅ **Response Monitoring** - Checks AI responses for policy violations
- ✅ **Audit Logging** - All security events logged to Stinger backend

### Coming Soon
- 🔜 API Authentication (Issue #4)
- 🔜 Enhanced retry logic (Issue #3)
- 🔜 Advanced error reporting (Issue #5)
- 🔜 Performance optimizations (Issue #6)

## Architecture

```
┌────────────────────┐            ┌───────────────────────────────┐
│   Content Script   │──────────▶│  Background Service Worker    │
│ (UI interception)  │  message  │  (policy RPC & logging)       │
└─────────┬──────────┘            └──────────────┬────────────────┘
          │DOM mut.                         HTTPS│
          ▼                                      ▼
 Web page (ChatGPT)        Stinger Policy API  ➜  Enterprise microservice
```

## Documentation

- [Installation Guide](docs/installation-guide.md)
- [Technical Design Document](docs/stinger_chrome_extension_design.md)
- [Development Guide](CLAUDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Post-Release Roadmap](docs/plans/POST_RELEASE_ROADMAP.md)

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
- Stinger API running on `http://localhost:8888` (or configured endpoint)
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

### Security Actions

- **🟢 Allow**: Content passes all security checks
- **🟡 Warning**: Content may violate policies - you can choose to proceed
- **🔴 Block**: Content violates policies and cannot be submitted

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

See our [Post-Release Roadmap](docs/plans/POST_RELEASE_ROADMAP.md) for planned features:
- 🔐 API Authentication & Authorization
- 🧪 Comprehensive Integration Testing
- 🔄 Advanced Retry Logic
- 📊 Enhanced Error Reporting
- ⚡ Performance Optimizations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Stinger Team**