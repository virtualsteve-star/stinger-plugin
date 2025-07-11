# Phase 2: Core Infrastructure & Architecture

**Duration:** Week 2 (5 days)  
**Status:** Not Started  
**Dependencies:** Phase 1 completion

## Overview

This phase establishes the core architectural patterns, shared utilities, and foundational services that all other components will build upon. We'll create a robust message passing system, storage abstraction, and API client foundation.

## Goals

1. Implement type-safe message passing system
2. Create storage abstraction layer
3. Build foundational API client
4. Establish error handling patterns
5. Set up logging infrastructure
6. Create shared utilities and types

## Implementation Tasks

### Day 1: Type System & Message Protocol

#### Morning (4 hours)
- [ ] Define core TypeScript types
  ```typescript
  // src/shared/types/api.ts
  interface CheckRequest {
    text: string;
    tenantId?: string;
    userId?: string;
    kind?: 'prompt' | 'response';
    detached?: boolean;
  }
  
  interface CheckResponse {
    action: 'allow' | 'warn' | 'block';
    reasons: string[];
    warnings: string[];
    metadata: {
      guardrails_triggered: string[];
      processing_time_ms: number;
    };
  }
  ```
- [ ] Create message protocol types
- [ ] Define storage schema interfaces
- [ ] Set up type exports and imports

#### Afternoon (4 hours)
- [ ] Implement message type guards
- [ ] Create message validation utilities
- [ ] Set up discriminated unions for messages
- [ ] Write tests for type safety

### Day 2: Message Passing System

#### Morning (4 hours)
- [ ] Create message bus abstraction
  ```typescript
  // src/shared/messaging/MessageBus.ts
  class MessageBus {
    async send<T>(message: Message): Promise<T>
    on<T>(type: string, handler: Handler<T>): void
    off(type: string, handler: Handler): void
  }
  ```
- [ ] Implement Chrome runtime wrapper
- [ ] Add request/response correlation
- [ ] Create timeout handling

#### Afternoon (4 hours)
- [ ] Build message queuing system
- [ ] Implement retry logic
- [ ] Add message deduplication
- [ ] Create comprehensive tests

### Day 3: Storage Abstraction Layer

#### Morning (4 hours)
- [ ] Design storage interface
  ```typescript
  // src/shared/storage/StorageService.ts
  interface StorageService {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T): Promise<void>
    remove(key: string): Promise<void>
    clear(): Promise<void>
  }
  ```
- [ ] Implement Chrome storage wrapper
- [ ] Add migration system
- [ ] Create storage versioning

#### Afternoon (4 hours)
- [ ] Build caching layer
- [ ] Implement storage quota management
- [ ] Add compression for large data
- [ ] Write storage tests

### Day 4: API Client Foundation

#### Morning (4 hours)
- [ ] Create base API client
  ```typescript
  // src/shared/api/StingerClient.ts
  class StingerClient {
    constructor(config: ApiConfig)
    async checkContent(request: CheckRequest): Promise<CheckResponse>
    async getRules(): Promise<RulesResponse>
    async health(): Promise<HealthResponse>
  }
  ```
- [ ] Implement request interceptors
- [ ] Add response transformers
- [ ] Create error handling

#### Afternoon (4 hours)
- [ ] Build retry mechanism with exponential backoff
- [ ] Implement circuit breaker pattern
- [ ] Add request timeout handling
- [ ] Create mock client for testing

### Day 5: Logging & Error Handling

#### Morning (4 hours)
- [ ] Design logging system
  ```typescript
  // src/shared/logging/Logger.ts
  class Logger {
    debug(message: string, context?: any): void
    info(message: string, context?: any): void
    warn(message: string, context?: any): void
    error(message: string, error?: Error): void
  }
  ```
- [ ] Implement log levels and filtering
- [ ] Add structured logging
- [ ] Create log persistence

#### Afternoon (4 hours)
- [ ] Build error boundary system
- [ ] Create error reporting utilities
- [ ] Implement telemetry collection
- [ ] Write comprehensive tests

## Testing Requirements

### Unit Tests
- [ ] Message passing system
  - Message validation
  - Type guards
  - Queue management
  - Retry logic
- [ ] Storage abstraction
  - CRUD operations
  - Migration system
  - Quota handling
  - Compression
- [ ] API client
  - Request/response handling
  - Timeout behavior
  - Retry mechanism
  - Circuit breaker

### Integration Tests
- [ ] Message bus with Chrome APIs
- [ ] Storage with Chrome storage
- [ ] API client with mock server
- [ ] End-to-end message flow

### Performance Tests
- [ ] Message throughput
- [ ] Storage operation speed
- [ ] API client latency
- [ ] Memory usage patterns

## Deliverables

1. **Type System**
   - Complete type definitions
   - Type guards and validators
   - Shared type exports
   - Documentation

2. **Message Infrastructure**
   - Message bus implementation
   - Chrome runtime wrapper
   - Queue and retry system
   - Correlation tracking

3. **Storage System**
   - Storage service interface
   - Chrome storage implementation
   - Migration framework
   - Caching layer

4. **API Foundation**
   - Stinger API client
   - Retry and circuit breaker
   - Mock implementation
   - Error handling

5. **Support Systems**
   - Logging framework
   - Error boundaries
   - Telemetry collection
   - Testing utilities

## Success Criteria

- [ ] All core services have >90% test coverage
- [ ] Message passing is type-safe end-to-end
- [ ] Storage operations handle quota limits gracefully
- [ ] API client handles all failure modes
- [ ] No memory leaks in long-running operations
- [ ] Performance meets defined benchmarks

## Performance Benchmarks

| Operation | Target | Maximum |
|-----------|--------|---------|
| Message round-trip | <10ms | 50ms |
| Storage read | <5ms | 20ms |
| Storage write | <10ms | 50ms |
| API request (local) | <50ms | 200ms |
| Log write | <1ms | 5ms |

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chrome API changes | High | Abstract all Chrome APIs behind interfaces |
| Message ordering issues | Medium | Implement sequence numbers and acknowledgments |
| Storage quota exceeded | Medium | Implement LRU eviction and compression |
| API client complexity | Medium | Keep client focused, avoid feature creep |

## Architecture Decisions

1. **Message Passing**: Use discriminated unions for type safety
2. **Storage**: Abstract Chrome storage to allow future backends
3. **API Client**: Implement circuit breaker to prevent cascade failures
4. **Logging**: Use structured logging for better debugging
5. **Testing**: Mock all Chrome APIs for unit tests

## Next Phase Prerequisites

Before moving to Phase 3, ensure:
- [ ] All core services are implemented and tested
- [ ] Documentation is complete for all APIs
- [ ] Performance benchmarks are met
- [ ] No critical bugs or tech debt
- [ ] Team is trained on using the infrastructure

## Notes

- Keep interfaces simple and focused
- Design for testability from the start
- Document all architectural decisions
- Prepare for extension across multiple browsers
- Consider future offline capabilities