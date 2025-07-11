.PHONY: help install dev build test lint format clean

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build extension for production
	npm run build

test: ## Run unit tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-e2e: ## Run E2E tests
	npm run test:e2e

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

typecheck: ## Run TypeScript type checking
	npm run typecheck

clean: ## Clean build artifacts
	rm -rf dist node_modules coverage

load-extension: build ## Instructions to load extension
	@echo "To load the extension in Chrome:"
	@echo "1. Open chrome://extensions/"
	@echo "2. Enable 'Developer mode'"
	@echo "3. Click 'Load unpacked'"
	@echo "4. Select the 'dist' directory"

start-api: ## Start local Stinger API
	@echo "Starting Stinger API on port 8888..."
	@echo "Make sure the Stinger API is running in the core project"