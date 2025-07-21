# Claude Development Instructions - Stinger Chrome Extension

## 🎯 Project Overview

This is the **Stinger Chrome Extension** project - a browser security plugin that provides real-time guardrail checks for LLM interactions. The extension intercepts user prompts and responses, analyzes them through the Stinger API, and provides security feedback.

**Current Status**: v0.1.0-a1 (Alpha release) with **SSE streaming integration in progress**

## 📋 Current Development Phase

### **🚀 ACTIVE: SSE Streaming Integration**

**Status**: ✅ **All integration blockers resolved - ready for implementation**

**Objective**: Transform batch security checks into real-time streaming for 20x UX improvement

**Key Integration Points**:
- **Content Script Direct SSE**: Recommended architecture by Core Engineering
- **Progress Indicators**: 500ms timeout-based approach for UX
- **Chrome Extension Headers**: X-Tab-ID, X-Session-ID, X-Extension-Version
- **Graceful Fallback**: SSE → Batch → Local validation → Allow with warning

**Implementation Plan**: See `/docs/plans/SSE_STREAMING_INTEGRATION_PLAN.md`

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
- **StingerClient**: API client for security analysis (batch mode)
- **StingerSSEClient**: NEW - Real-time streaming client 
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
- **Performance Testing**: <100ms first response target for streaming

### **File Organization**
- **Tests**: Keep tests in `/tests/` directory
- **Documentation**: Use `/docs/` for all documentation
- **Plans**: Store planning documents in `/docs/plans/`

## 🚨 Critical Technical Notes

### **Chrome Extension Specifics**
- **Service Worker Context**: No `window` object, use Chrome APIs
- **Content Script Context**: Full DOM access, can use EventSource directly
- **CORS**: Backend configured for extension origins
- **CSP**: Content Security Policy compatible with SSE streaming

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
- **Streaming Target**: <100ms first feedback (vs 3-5s batch)
- **Memory Management**: Bounded cache with LRU eviction
- **Network Efficiency**: Minimize API calls through intelligent caching
- **Battery Impact**: Optimize for mobile browser usage

## 🔄 Current Integration Status

### **Core Engineering Collaboration**
✅ **EventSource Architecture**: Content script direct SSE recommended  
✅ **Progress Indicators**: Simple timeout-based solution provided  
✅ **Backend Ready**: `/api/v1/stream/analyze` endpoint fully configured  
✅ **CORS Configured**: Chrome extension origins supported  
✅ **Headers Supported**: All extension metadata processed  

### **QA Validation**
✅ **Load Testing**: 100% success rate across scenarios  
✅ **Critical Issues**: Conversation limit handling resolved  
✅ **Production Readiness**: All blocking issues addressed  

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
- `/docs/plans/SSE_STREAMING_INTEGRATION_PLAN.md` - Current implementation plan
- `/docs/plans/POST_RELEASE_ROADMAP.md` - Post-streaming roadmap

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

### **Your Role: Stinger-Plugin Team Agent**

You are the official AI agent representing the **Stinger-Plugin Team** in the inter-agent communication system.

**Communication Protocol**:
- **Incoming Messages**: Check `/AgentMail/stinger-plugin/` for messages from other teams
- **Outgoing Messages**: Send responses to `/AgentMail/[team-name]/`
- **Message Format**: Markdown files with clear subject lines and structured content

**Key Collaborations**:
- **stinger-core-eng**: Backend API integration and SSE streaming
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

### **Immediate Priorities (This Week)**
1. **Implement StingerSSEClient**: Direct SSE connection from content scripts
2. **Add Progress Indicators**: 500ms timeout-based "Security scanning..." message
3. **Update PromptInterceptor**: Integrate streaming analysis with existing interception
4. **Test Chrome Integration**: Validate SSE works in real extension context

### **Success Criteria**
- **Performance**: <100ms first feedback (FAST guardrails)
- **UX**: Progressive security analysis with clear progress indication
- **Reliability**: Graceful fallback to batch mode if streaming fails
- **Compatibility**: Works across ChatGPT, Claude, and other LLM sites

### **Integration Validation**
- **Unit Tests**: SSE client connection handling and error recovery
- **Integration Tests**: End-to-end streaming with real ChatGPT
- **Performance Tests**: Validate 20x UX improvement target
- **User Experience**: Test progress indicators and transparency

---

**Current Focus**: 🚀 **SSE Streaming Integration - Week 1**  
**Timeline**: 1-2 weeks to production-ready streaming  
**Impact**: 20x UX improvement - industry-leading streaming security  
**Status**: All blockers resolved, ready for implementation

*Remember: This streaming integration represents a major UX breakthrough. Focus on delivering the industry-leading real-time security experience that transforms user perception from "security blocking" to "security enabling."*