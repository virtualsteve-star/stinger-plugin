# Manual Test Scripts

This directory contains manual test scripts used during development and debugging of the Stinger Chrome Extension.

## Test Scripts

### API Testing
- `test-api-direct.js` - Direct API testing without the extension
- `test-api-presets.js` - Testing different API presets and configurations
- `test-phase15-api.js` - Specific tests for Phase 15 API integration
- `test-conversation.js` - Conversation tracking and context testing

### DOM and Response Testing
- `debug-chatgpt-dom.js` - Debug script for analyzing ChatGPT DOM structure
- `test-response-detection.js` - Testing response detection in ChatGPT
- `test-complete-response.js` - Testing complete response handling

### Extension Testing
- `test-extension.html` - HTML page for testing extension features in isolation

## Usage

These scripts are meant to be run manually during development:

```bash
# API tests
node tests/manual/test-api-direct.js
node tests/manual/test-conversation.js

# DOM debugging
node tests/manual/debug-chatgpt-dom.js

# Open in browser
open tests/manual/test-extension.html
```

## Note

These are development tools and not part of the automated test suite. For automated tests, see the unit tests in `/tests/unit/`.