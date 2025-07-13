# Technical Debt Tracking

This document tracks technical debt items that need to be addressed post-release.

## 🔴 Critical Issues (Must Fix)

### Test Architecture Problems
**Created**: 2025-07-13  
**Priority**: High  
**Estimated Effort**: 2-3 days  

**Issues**:
1. **Background Service Worker Tests**: Module mocking issues preventing handler registration capture
   - Tests expect to capture handlers from `messageBus.on()` calls
   - Background script creates new MessageBus instance instead of using mocked one
   - Need to refactor test architecture to properly mock constructor

2. **StingerClient Tests**: Test expectations don't match current implementation
   - Tests written before input validation was added
   - 15 failing tests due to validation logic changes
   - Error message expectations outdated

3. **MessageBus Tests**: 2 failing tests with timeout and console mocking issues
   - Console error spy not capturing logs correctly
   - Cleanup test timing out at 1000ms

**Root Cause**: Tests were written early in development and became stale as implementation evolved. Test mocking strategy needs overhaul.

**Action Plan**:
1. **Phase 1**: Refactor MessageBus constructor mocking in background tests
2. **Phase 2**: Update StingerClient test expectations to match current validation
3. **Phase 3**: Fix MessageBus console logging and cleanup timing issues
4. **Phase 4**: Add integration tests to supplement unit tests

**Tracking**: 
- [ ] Issue #8: Comprehensive test architecture refactor
- [ ] Document test patterns in CONTRIBUTING.md
- [ ] Add pre-commit hooks for test validation

## 🟡 Medium Priority

### Console Logging in Production Code
**Created**: 2025-07-13  
**Priority**: Medium  
**Estimated Effort**: 1 day  

StorageService.ts uses `console.error` for error logging in tests. Should use structured logger instead.

**Location**: `extension/src/shared/storage/StorageService.ts:36`

## 📋 Process Improvements

### Test Maintenance Strategy
- **Prevention**: Add test validation to CI that fails if >10% of tests are skipped
- **Monitoring**: Monthly review of skipped tests with effort estimates
- **Documentation**: Maintain test coverage requirements in CONTRIBUTING.md

### Technical Debt Review Process
- **Weekly**: Review and prioritize new debt items
- **Monthly**: Dedicated debt reduction sprint
- **Quarterly**: Architectural review to prevent debt accumulation

---

**Note**: This file should be updated whenever technical debt is created or resolved. All skipped tests and workarounds must have corresponding tracking items.