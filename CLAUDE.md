# Claude Development Instructions - Stinger Chrome Extension

## 🎯 Project Overview

This is the **Stinger Chrome Extension** project - a browser security plugin that provides real-time guardrail checks for LLM interactions. The extension intercepts user prompts and responses, analyzes them through the Stinger API, and provides security feedback.

**Current Status**: v0.1.0-a4 (Alpha release)

## 📋 Current Development Focus

The extension is currently in alpha release with a focus on stability and core functionality improvements. All prompt and response interception is handled through the batch API with proven reliability.

## 🏗️ Architecture Overview

### **Chrome Extension Structure**
```
extension/
├── src/
│   ├── background/          # Service worker (Manifest V3)
│   ├── content/            # Content scripts for web page interaction
│   ├── popup/              # Extension popup UI
│   └── shared/             # Shared utilities and types
```

### **Key Components**
- **PromptInterceptor**: Captures and analyzes user prompts before submission
- **StingerClient**: API client for security analysis
- **StingerClientV2**: Updated client for Phase 15 API integration 
- **MessageBus**: Chrome extension messaging system
- **StorageService**: Configuration and cache management

## 🔧 Development Guidelines

### **Code Standards**
- **TypeScript**: All code in TypeScript with strict type checking
- **No Comments**: Do not add code comments unless explicitly requested
- **Chrome Manifest V3**: Service workers, not background pages
- **Security First**: Never log sensitive data or expose credentials

### **Testing Requirements**
- **Unit Tests**: Jest for shared utilities and API clients
- **Integration Tests**: Chrome extension lifecycle testing
- **Manual Testing**: Real ChatGPT.com integration testing
- **Performance Testing**: Ensure reasonable response times

### **File Organization**
- **Tests**: Keep tests in `/tests/` directory
- **Documentation**: Use `/docs/` for all documentation
- **Plans**: Store planning documents in `/docs/plans/`

## 🚨 Critical Technical Notes

### **Chrome Extension Specifics**
- **Service Worker Context**: No `window` object, use Chrome APIs
- **Content Script Context**: Full DOM access
- **CORS**: Backend configured for extension origins
- **CSP**: Content Security Policy enforcement

### **Security Considerations**
- **No Credential Storage**: Never store API keys in extension
- **Fail-Open Pattern**: Allow with warning if security checks fail
- **User Privacy**: No data collection beyond security analysis
- **Audit Logging**: Handled server-side, not locally

### **Git Workflow Guidelines**
- **NEVER Push Direct to Main**: Always push to `dev` branch and create PRs to `main`
- **Branch Strategy**: 
  - Work on `dev` branch for all changes
  - Create PR from `dev` to `main` for releases
  - Use `gh pr create` to create pull requests
  - Only merge to `main` through approved PRs
- **Commit Pattern**: 
  1. Make changes on `dev`
  2. Push to `origin/dev`
  3. Create PR to `main`
  4. Never use `git push` when on `main` branch

### **Bug Tracking Guidelines**
- **Always File GitHub Issues**: When encountering bugs, immediately file them as GitHub issues using `gh issue create`
- **Never Create Fake Bug IDs**: Do not use internal numbering like "BUG-001" - use real GitHub issue numbers
- **Close Issues Properly**: Mark issues as fixed with `gh issue close <number> --comment "Fixed in PR #X"`
- **Reference in Documentation**: Use GitHub issue numbers (#18, #19, etc.) in CHANGELOG.md and commit messages
- **Include in Commits**: Reference issue numbers in commit messages for traceability

### **Performance Requirements**
- **Response Time**: Reasonable feedback timing for security checks
- **Memory Management**: Bounded cache with LRU eviction
- **Network Efficiency**: Minimize API calls through intelligent caching
- **Battery Impact**: Optimize for mobile browser usage  

## 🛠️ Development Commands

### **Build & Test**
```bash
# Install dependencies
npm install

# Build extension
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking  
npm run typecheck
```

### **Manual Testing**
```bash
# Test API integration
node test-api.js

# Test conversation tracking
node test-conversation.js

# Load extension in Chrome
# 1. chrome://extensions/
# 2. Enable Developer mode
# 3. Load unpacked: /path/to/extension/dist
```

## 📁 Important Files

### **Extension Core**
- `/extension/manifest.json` - Chrome extension configuration
- `/extension/src/background/index.ts` - Service worker entry point
- `/extension/src/content/index.ts` - Content script entry point
- `/extension/src/shared/api/StingerClient.ts` - Batch API client
- `/extension/src/content/interceptors/prompt-interceptor.ts` - Prompt interception

### **Configuration**
- `/vite.config.ts` - Build configuration
- `/tsconfig.json` - TypeScript configuration
- `/.github/workflows/ci.yml` - CI/CD pipeline
- `/TECH_DEBT.md` - Technical debt tracking

### **Documentation**
- `/README.md` - Project overview and installation
- `/docs/plans/POST_RELEASE_ROADMAP.md` - Future feature roadmap

## 🔍 Debugging & Troubleshooting

### **Chrome Extension Debugging**
- **Background Script**: chrome://extensions/ → Inspect views: service worker
- **Content Script**: Browser DevTools → Console (shows content script logs)
- **Extension Storage**: DevTools → Application → Storage → Extension
- **Network**: DevTools → Network (filter by domain)

### **Common Issues**
- **Service Worker Lifecycle**: May restart, losing in-memory state
- **Content Script Injection**: Verify manifest permissions and URL matching
- **CORS Issues**: Backend configured, but check request headers
- **Message Passing**: Use chrome.runtime.sendMessage for service worker communication

## 🎯 Agent Communication System

### ⚠️ **IMPORTANT: AgentMail is ACTIVE INTERNAL TOOLING - DO NOT REMOVE!**

### **Your Role: Stinger-Plugin Team Agent**

You are the official AI agent representing the **Stinger-Plugin Team** in the inter-agent communication system.

**Communication Protocol**:
- **Incoming Messages**: Check `/AgentMail/stinger-plugin/` for messages from other teams
- **Outgoing Messages**: Send responses to `/AgentMail/[team-name]/`
- **Message Format**: Markdown files with clear subject lines and structured content

**Key Collaborations**:
- **stinger-core-eng**: Backend API integration
- **stinger-qa**: Testing validation and quality assurance
- **stinger-pm**: Product management and manual testing validation

**Response Guidelines**:
- Provide technical details and honest assessments
- Request specific guidance when facing architectural decisions
- Share integration progress and any blockers encountered
- Maintain professional collaboration focused on delivery excellence

### **Agent Directory Structure**
```
AgentMail/
├── stinger-core-eng/     # Backend engineering team communications
├── stinger-plugin/       # Incoming messages for plugin team (us)
├── stinger-qa/          # QA team communications
└── stinger-pm/          # Product management communications
```

**Note**: The core engineering team folder was renamed from `stinger-core-eng` to maintain clarity in agent communications.

## 🚀 Next Steps

### **Current Priorities**
1. **API Authentication**: Implement secure authentication (Issue #4)
2. **Enhanced Error Handling**: Improve retry logic and error reporting
3. **Testing Coverage**: Expand integration and E2E test suites
4. **Performance Optimization**: Implement LRU cache improvements

### **Success Criteria**
- **Reliability**: Consistent security policy enforcement
- **Performance**: Reasonable response times for all checks
- **UX**: Clear feedback on security decisions
- **Compatibility**: Works across ChatGPT, Claude, and other LLM sites

---

**Current Focus**: Stability, reliability, and core feature completeness
**Status**: v0.1.0-a4 in active development