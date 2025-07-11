# Stinger Plugin

A Chrome extension that provides real-time security guardrails for Large Language Model (LLM) interactions on web-based platforms.

## ⚠️ Evaluation License

**This software is provided for EVALUATION PURPOSES ONLY under a proprietary license. Commercial use is strictly prohibited. See [LICENSE](LICENSE) for details.**

## Overview

Stinger Plugin is a Chrome Extension (Manifest V3) that monitors and enforces security policies for prompts and responses on LLM interfaces like ChatGPT and Microsoft Copilot. It integrates with the [Stinger](https://github.com/virtualsteve-star/stinger) policy engine to prevent sensitive data leakage and enforce enterprise security policies.

### Key Features

- 🛡️ **Real-time Content Filtering** - Scans prompts before submission and responses as they arrive
- 🔍 **PII Detection** - Identifies and blocks personal identifiable information
- 🚫 **Secret Prevention** - Detects API keys, passwords, and other credentials
- 📊 **Audit Logging** - Comprehensive security event logging for SOC teams
- 🏢 **Enterprise Ready** - Centralized policy management and deployment
- 🌐 **Multi-Platform Support** - Works with ChatGPT, Microsoft Copilot, and more

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

- [Technical Design Document](docs/stinger_chrome_extension_design.md)
- [Execution Plan](docs/plans/stinger-plugin-execution-plan.md)
- [Development Guide](CLAUDE.md)

## Project Status

🚧 **Under Development** - This project is in active development. MVP targeted for 5-week development cycle.

### Development Progress
- ✅ **Phase 1: Project Setup & Infrastructure** (Complete)
  - TypeScript + Vite build system configured
  - Chrome Extension Manifest V3 structure
  - Testing infrastructure (Jest + Playwright)
  - Basic extension loads in Chrome
  
- 🔄 **Phase 2: Core Infrastructure** (In Progress)
  - Message passing system
  - Storage abstraction
  - API client development
  
- ⏳ **Phase 3: Content Script Development** (Upcoming)
- ⏳ **Phase 4: Background Worker & API Integration** (Upcoming)
- ⏳ **Phase 5: Testing & Demo Preparation** (Upcoming)

## Prerequisites

- Node.js 18+ and npm
- Chrome 118+ for development
- Access to Stinger Policy API (provided by [Stinger core](https://github.com/virtualsteve-star/stinger))

## Quick Start

```bash
# Clone the repository
git clone https://github.com/virtualsteve-star/stinger-plugin.git
cd stinger-plugin

# Checkout development branch
git checkout dev

# Install dependencies and build
npm install

# Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the 'dist' directory

# Start development
npm run build:watch  # Auto-rebuild on changes
```

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

## Testing the API

Before using the extension, ensure the Stinger API is running:

```bash
# In the Stinger core repository
python -m stinger.api

# Test the connection (in this repo)
node test-api.js
```

## Contributing

This project is currently under proprietary evaluation license. External contributions are not accepted at this time.

## Security

This extension is designed with security as the primary focus:
- All prompts/responses are hashed before local storage
- HTTPS with certificate pinning for API communication
- Minimal Chrome permissions requested
- Content Security Policy enforcement
- No remote code execution

## Contact

For evaluation licenses or questions about this project, please contact the repository owner.

## License

Copyright (c) 2025 VirtualSteve-Star. All rights reserved.

This software is licensed for evaluation purposes only. See [LICENSE](LICENSE) for full terms.

---

**Note:** This extension requires the Stinger Policy API to be deployed and accessible. The API is being developed as part of the [Stinger core project](https://github.com/virtualsteve-star/stinger).