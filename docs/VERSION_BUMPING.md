# Version Bumping Guide

This document describes how to bump versions in the Stinger Chrome Extension project.

## Quick Start

Use the automated version bump script:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm run version:patch

# Minor version (0.1.0 -> 0.2.0)  
npm run version:minor

# Major version (0.1.0 -> 1.0.0)
npm run version:major

# Alpha version (0.1.0 -> 0.1.1-a1)
npm run version:alpha

# Beta version (0.1.0 -> 0.1.1-beta1)
npm run version:beta

# Specific version
node scripts/bump-version.js 1.2.3
```

## What the Script Does

1. **Updates package.json** - Bumps the version field
2. **Updates CHANGELOG.md** - Moves [Unreleased] content to new version section
3. **Updates README.md** - Updates version badges and references
4. **Builds project** - Runs `npm run build` to ensure everything works
5. **Runs tests** - Runs `npm test` to ensure no regressions
6. **Provides next steps** - Shows git commands to complete the release

## Manual Process

If you prefer to do it manually:

1. **Update package.json version**
2. **Update CHANGELOG.md**:
   - Move [Unreleased] content to new version section
   - Add new version with date: `## [1.2.3] - 2025-07-17`
   - Update version links at bottom
3. **Update README.md**:
   - Update version badge
   - Update any version references in headers
4. **Build and test**:
   ```bash
   npm run build
   npm test
   ```
5. **Commit and tag**:
   ```bash
   git add -A
   git commit -m "chore: bump version to 1.2.3"
   git tag v1.2.3
   git push origin dev --tags
   ```

## Version Types

- **patch**: Bug fixes, small improvements (0.1.0 -> 0.1.1)
- **minor**: New features, backwards compatible (0.1.0 -> 0.2.0)
- **major**: Breaking changes (0.1.0 -> 1.0.0)
- **alpha**: Pre-release testing (0.1.0 -> 0.1.1-a1)
- **beta**: Beta testing (0.1.0 -> 0.1.1-beta1)

## Pre-release Versions

The script handles pre-release versions intelligently:

- `0.1.0-a1` + alpha = `0.1.0-a2`
- `0.1.0-beta1` + beta = `0.1.0-beta2`
- `0.1.0` + alpha = `0.1.1-a1`

## Release Workflow

1. **Develop on `dev` branch**
2. **When ready for release**:
   - Run version bump script
   - Review changes
   - Commit and tag
   - Push to origin
3. **Create PR to `main`**
4. **After merge**: Create GitHub release with tag