# Contributing to Stinger Plugin

Thank you for your interest in contributing to Stinger Plugin! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites
- Node.js 18.x or 20.x
- npm (comes with Node.js)
- Chrome browser for testing

### Getting Started
```bash
# Clone the repository
git clone https://github.com/virtualsteve-star/stinger-plugin.git
cd stinger-plugin

# Install dependencies
npm ci

# Run local CI checks
npm run ci:local

# Build the extension
npm run build

# Start development mode
npm run build:watch
```

### Loading in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist` directory

## Development Workflow

### Before You Start
1. Check existing issues and PRs to avoid duplication
2. For major changes, open an issue first to discuss
3. Fork the repository and create a feature branch

### Making Changes
1. **Follow naming conventions**: Use descriptive branch names like `feat/streaming-optimization` or `fix/popup-crash`
2. **Keep commits atomic**: One logical change per commit
3. **Write good commit messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code formatting
- `refactor`: Code changes without fixing bugs or adding features
- `test`: Adding or updating tests
- `ci`: CI/CD changes
- `deps`: Dependency updates

**Scopes:**
- `content`: Content script changes
- `background`: Background worker changes
- `popup`: Popup UI changes
- `api`: API client changes
- `types`: TypeScript type definitions

**Examples:**
```
feat(content): add streaming response optimization
fix(popup): resolve crash on settings save
docs: update installation guide
test(api): add unit tests for StingerClient
```

### Testing
Always run these before submitting a PR:
```bash
# Run all checks locally
npm run ci:local

# Run specific checks
npm run typecheck
npm run lint
npm run test
npm run test:e2e

# Check formatting
npm run format:check
```

### Code Quality Guidelines

#### TypeScript
- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### Testing
- Write unit tests for all new functionality
- Update E2E tests for UI changes
- Aim for high test coverage (target: >80%)
- Mock external dependencies

#### Performance
- Keep bundle size minimal
- Use lazy loading where appropriate
- Avoid memory leaks in content scripts
- Test on multiple Chrome versions

## Pull Request Process

### Before Submitting
1. **Rebase your branch** on the latest `dev` branch
2. **Run CI locally**: `npm run ci:local`
3. **Test thoroughly**: Manual testing + automated tests
4. **Update documentation** if needed

### PR Requirements
- [ ] Clear, descriptive title
- [ ] Detailed description of changes
- [ ] All CI checks pass
- [ ] Tests added/updated as needed
- [ ] Documentation updated
- [ ] Compatible with Stinger API v0.1.0a3

### Review Process
1. PRs require at least one approval
2. All CI checks must pass
3. Code owner review may be required
4. Address all review feedback before merge

## Architecture Guidelines

### File Organization
```
extension/src/
├── background/     # Background service worker
├── content/        # Content scripts
│   ├── interceptors/  # Prompt/response interception
│   ├── observers/     # DOM observation
│   ├── selectors/     # Site-specific selectors
│   └── ui/           # Injected UI components
├── popup/          # Extension popup
└── shared/         # Shared utilities
    ├── api/           # API clients
    ├── messaging/     # Chrome messaging
    ├── storage/       # Chrome storage
    ├── types/         # TypeScript types
    └── utils/         # Utility functions
```

### Key Principles
- **Separation of concerns**: Each module has a single responsibility
- **Type safety**: Comprehensive TypeScript usage
- **Error handling**: Graceful failure with proper logging
- **Security first**: Validate all external inputs
- **Performance**: Minimize impact on host pages

## Stinger API Integration

### Compatibility
- Target Stinger API v0.1.0a3
- Use provided TypeScript types
- Handle API errors gracefully
- Mock API responses in tests

### Testing API Integration
```bash
# Test against local Stinger API
export STINGER_API_URL=http://localhost:8888
npm test

# Test against staging API
export STINGER_API_URL=https://staging.stinger.dev
npm run test:e2e
```

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow
1. Create release branch from `main`
2. Update version in `package.json` and `manifest.json`
3. Update CHANGELOG.md
4. Create PR to `main`
5. After merge, create git tag: `git tag v1.0.0`
6. Push tag: `git push origin v1.0.0`
7. GitHub Actions will create release automatically

## Getting Help

### Communication Channels
- **Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Stinger Core Team**: #plugin-dev channel (internal)

### Common Issues
- **Build failures**: Check Node.js version and dependencies
- **Test failures**: Ensure clean git state and updated dependencies
- **Chrome API changes**: Update `@types/chrome` dependency
- **Performance issues**: Use Chrome DevTools for profiling

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report unacceptable behavior

## Security

- Never commit secrets or API keys
- Report security issues privately to the maintainers
- Follow secure coding practices
- Validate all user inputs

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to Stinger Plugin! 🎉