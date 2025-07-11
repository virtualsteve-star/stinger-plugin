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

🚧 **Under Development** - This project is in active development. The execution plan outlines an 8-10 week development timeline.

### Current Phase
- [ ] Phase 1: Project Setup & Infrastructure
- [ ] Phase 2: Content Script Development
- [ ] Phase 3: UI Components & Response Monitoring
- [ ] Phase 4: Background Worker & API Integration
- [ ] Phase 5: Security & Enterprise Features
- [ ] Phase 6: Testing & Optimization
- [ ] Phase 7: CI/CD & Release Engineering
- [ ] Phase 8: Documentation & Pilot Program

## Prerequisites

- Node.js 18+ and npm
- Chrome 118+ for development
- Access to Stinger Policy API (provided by [Stinger core](https://github.com/virtualsteve-star/stinger))

## Development Setup

```bash
# Clone the repository
git clone https://github.com/virtualsteve-star/stinger-plugin.git
cd stinger-plugin

# Checkout development branch
git checkout dev

# Install dependencies (once package.json is created)
npm install

# Start development build (once configured)
npm run dev
```

## Repository Structure

```
/
├── docs/                    # Documentation
│   ├── plans/              # Execution plans
│   └── stinger_chrome_extension_design.md
├── extension/              # Chrome extension source (to be created)
│   ├── src/               # TypeScript source files
│   ├── assets/            # Icons and static files
│   └── manifest.json      # Chrome extension manifest
├── tests/                  # Test suites (to be created)
├── .github/               # GitHub Actions workflows (to be created)
└── CLAUDE.md              # AI assistant guidance
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