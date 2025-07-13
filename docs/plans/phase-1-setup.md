# Phase 1: Project Setup & Infrastructure

**Duration:** Week 1 (5 days)  
**Status:** Not Started  
**Dependencies:** None

## Overview

This phase establishes the foundation for the Stinger Chrome Extension development, including project structure, build system, development environment, and basic Chrome extension scaffold.

## Goals

1. Set up TypeScript project with proper configuration
2. Configure Vite for Chrome extension bundling
3. Create basic extension structure that loads in Chrome
4. Set up development tools and workflows
5. Establish testing infrastructure
6. Create initial CI/CD pipeline

## Implementation Tasks

### Day 1: Project Initialization

#### Morning (4 hours)
- [ ] Initialize npm project with TypeScript 5
  ```bash
  npm init -y
  npm install --save-dev typescript@5 @types/chrome @types/node
  ```
- [ ] Create `tsconfig.json` with Chrome extension optimizations
- [ ] Set up ESLint and Prettier
  ```bash
  npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
  ```
- [ ] Configure `.eslintrc.js` and `.prettierrc`
- [ ] Create npm scripts for linting and formatting

#### Afternoon (4 hours)
- [ ] Install and configure Vite
  ```bash
  npm install --save-dev vite @vitejs/plugin-react
  npm install --save-dev @crxjs/vite-plugin
  ```
- [ ] Create `vite.config.ts` for Chrome extension bundling
- [ ] Set up hot module replacement for development
- [ ] Configure source maps for debugging

### Day 2: Chrome Extension Scaffold

#### Morning (4 hours)
- [ ] Create `manifest.json` (Manifest V3)
  ```json
  {
    "manifest_version": 3,
    "name": "Stinger Guard",
    "version": "0.1.0",
    "description": "Security guardrails for LLM interactions",
    "permissions": ["storage", "alarms"],
    "host_permissions": [
      "https://chat.openai.com/*",
      "https://copilot.microsoft.com/*"
    ]
  }
  ```
- [ ] Create directory structure:
  ```
  extension/
  ├── manifest.json
  ├── src/
  │   ├── content/
  │   │   └── index.ts
  │   ├── background/
  │   │   └── index.ts
  │   └── shared/
  │       ├── types/
  │       └── utils/
  ├── assets/
  │   └── icons/
  └── public/
  ```
- [ ] Create placeholder TypeScript files
- [ ] Generate extension icons (16x16, 32x32, 48x48, 128x128)

#### Afternoon (4 hours)
- [ ] Implement basic message passing between content and background
- [ ] Create development load script
- [ ] Test extension loading in Chrome
- [ ] Set up Chrome extension reload on file changes

### Day 3: Testing Infrastructure

#### Morning (4 hours)
- [ ] Install Jest and Chrome extension testing utilities
  ```bash
  npm install --save-dev jest @types/jest ts-jest
  npm install --save-dev jest-chrome jest-environment-jsdom
  ```
- [ ] Configure `jest.config.js` for TypeScript and Chrome APIs
- [ ] Create test directory structure
- [ ] Write first unit test for message passing

#### Afternoon (4 hours)
- [ ] Install Playwright for E2E testing
  ```bash
  npm install --save-dev playwright @playwright/test
  ```
- [ ] Configure Playwright for Chrome extension testing
- [ ] Create E2E test for extension installation
- [ ] Set up test data and fixtures

### Day 4: Development Environment

#### Morning (4 hours)
- [ ] Create `.env.example` with API configuration
  ```
  VITE_STINGER_API_URL=http://localhost:8888
  VITE_API_TIMEOUT=2000
  ```
- [ ] Set up environment variable loading in Vite
- [ ] Create development Chrome profile setup script
- [ ] Document local development workflow

#### Afternoon (4 hours)
- [ ] Create Makefile for common tasks
- [ ] Set up Git hooks with Husky
  ```bash
  npm install --save-dev husky lint-staged
  ```
- [ ] Configure pre-commit hooks for linting
- [ ] Create development documentation

### Day 5: CI/CD Foundation

#### Morning (4 hours)
- [ ] Create `.github/workflows/ci.yml`
- [ ] Set up automated testing on pull requests
- [ ] Configure code coverage reporting
- [ ] Add build status badges to README

#### Afternoon (4 hours)
- [ ] Create release workflow
- [ ] Set up semantic versioning
- [ ] Configure automated changelog generation
- [ ] Test complete CI/CD pipeline

## Testing Requirements

### Unit Tests
- [ ] Project configuration tests
- [ ] Build system tests
- [ ] Environment variable loading
- [ ] Basic Chrome API mocking

### Integration Tests
- [ ] Extension loads successfully
- [ ] Content script injection works
- [ ] Background worker starts
- [ ] Message passing functions

### E2E Tests
- [ ] Extension installs in Chrome
- [ ] Permissions are correctly set
- [ ] Basic UI elements appear
- [ ] No console errors on target sites

## Deliverables

1. **Working Development Environment**
   - TypeScript compilation
   - Vite bundling with HMR
   - Chrome extension loading
   - Linting and formatting

2. **Basic Extension Structure**
   - Manifest V3 configuration
   - Content/background script scaffold
   - Message passing setup
   - Icon assets

3. **Testing Infrastructure**
   - Jest unit testing
   - Playwright E2E testing
   - Chrome API mocks
   - CI/CD pipeline

4. **Documentation**
   - Development setup guide
   - Architecture decisions
   - Contributing guidelines
   - API integration notes

## Success Criteria

- [ ] Extension loads in Chrome without errors
- [ ] TypeScript compiles without warnings
- [ ] All tests pass (unit and E2E)
- [ ] Hot reload works in development
- [ ] CI/CD pipeline runs successfully
- [ ] Documentation is complete and accurate

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vite/Chrome extension compatibility | High | Use @crxjs/vite-plugin, fallback to webpack |
| Chrome API type definitions | Medium | Use @types/chrome, create custom types as needed |
| Testing Chrome APIs | Medium | Use jest-chrome for mocking |
| Hot reload complexity | Low | Manual reload fallback option |

## Next Phase Prerequisites

Before moving to Phase 2, ensure:
- [ ] All deliverables are complete
- [ ] Tests are passing with >80% coverage
- [ ] Team is familiar with the development workflow
- [ ] Documentation is reviewed and approved
- [ ] No blocking issues in the backlog

## Notes

- Keep the initial setup simple and extensible
- Focus on developer experience and productivity
- Ensure all team members can set up the environment easily
- Document any Chrome-specific quirks discovered
- Prepare for iterative improvements in later phases