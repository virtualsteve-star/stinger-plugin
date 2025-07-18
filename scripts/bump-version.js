#!/usr/bin/env node

/**
 * Version Bump Script for Stinger Chrome Extension
 * 
 * Usage:
 *   node scripts/bump-version.js patch   # 0.1.0 -> 0.1.1
 *   node scripts/bump-version.js minor   # 0.1.0 -> 0.2.0
 *   node scripts/bump-version.js major   # 0.1.0 -> 1.0.0
 *   node scripts/bump-version.js alpha   # 0.1.0 -> 0.1.0-a1
 *   node scripts/bump-version.js beta    # 0.1.0 -> 0.1.0-beta1
 *   node scripts/bump-version.js 1.2.3   # Set specific version
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VERSION_TYPE = process.argv[2];
const PROJECT_ROOT = process.cwd();

if (!VERSION_TYPE) {
  console.error('Usage: node scripts/bump-version.js <patch|minor|major|alpha|beta|x.y.z>');
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`Current version: ${currentVersion}`);

// Parse version components
const parseVersion = (version) => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) throw new Error(`Invalid version format: ${version}`);
  
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prerelease: match[4] || null
  };
};

// Generate new version
const generateNewVersion = (current, type) => {
  if (type.match(/^\d+\.\d+\.\d+(-.*)?$/)) {
    // Explicit version provided
    return type;
  }
  
  const parsed = parseVersion(current);
  
  switch (type) {
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    
    case 'major':
      return `${parsed.major + 1}.0.0`;
    
    case 'alpha':
      if (parsed.prerelease && parsed.prerelease.startsWith('a')) {
        const alphaNum = parseInt(parsed.prerelease.substring(1)) + 1;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-a${alphaNum}`;
      }
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-a1`;
    
    case 'beta':
      if (parsed.prerelease && parsed.prerelease.startsWith('beta')) {
        const betaNum = parseInt(parsed.prerelease.substring(4)) + 1;
        return `${parsed.major}.${parsed.minor}.${parsed.patch}-beta${betaNum}`;
      }
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-beta1`;
    
    default:
      throw new Error(`Unknown version type: ${type}`);
  }
};

const newVersion = generateNewVersion(currentVersion, VERSION_TYPE);
console.log(`New version: ${newVersion}`);

// Get current date for changelog
const currentDate = new Date().toISOString().split('T')[0];

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ Updated package.json');

// Update Chrome extension manifest.json
const manifestPath = path.join(PROJECT_ROOT, 'extension/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Convert semantic version to Chrome extension format (x.y.z.w)
  const chromeVersion = newVersion.replace(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/, (match, major, minor, patch, prerelease) => {
    if (prerelease) {
      // Convert pre-release to build number
      const buildNum = prerelease.replace(/^a/, '').replace(/^beta/, '0');
      return `${major}.${minor}.${patch}.${buildNum}`;
    }
    return `${major}.${minor}.${patch}`;
  });
  
  manifest.version = chromeVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('✅ Updated extension/manifest.json');
}

// Update CHANGELOG.md
const changelogPath = path.join(PROJECT_ROOT, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  
  // Move [Unreleased] content to new version section
  const unreleasedSection = changelog.match(/## \[Unreleased\]\s*([\s\S]*?)(?=## \[|$)/);
  
  if (unreleasedSection && unreleasedSection[1].trim()) {
    // There's unreleased content, move it to the new version
    const newVersionSection = `## [${newVersion}] - ${currentDate}\n${unreleasedSection[1]}`;
    changelog = changelog.replace(
      /## \[Unreleased\]\s*([\s\S]*?)(?=## \[)/,
      `## [Unreleased]\n\n${newVersionSection}## [`
    );
  } else {
    // No unreleased content, just add new version section
    changelog = changelog.replace(
      /## \[Unreleased\]/,
      `## [Unreleased]\n\n## [${newVersion}] - ${currentDate}\n\n### Added\n- Version bump to ${newVersion}\n`
    );
  }
  
  // Update version links at bottom
  const linkMatch = changelog.match(/\[Unreleased\]: (.+?)\/compare\/(.+?)\.\.\.HEAD/);
  if (linkMatch) {
    const repoUrl = linkMatch[1];
    const lastVersion = linkMatch[2];
    
    // Update links
    changelog = changelog.replace(
      /\[Unreleased\]: (.+?)\/compare\/(.+?)\.\.\.HEAD/,
      `[Unreleased]: ${repoUrl}/compare/v${newVersion}...HEAD`
    );
    
    // Add new version link
    changelog = changelog.replace(
      /(\[Unreleased\]: .+?\n)/,
      `$1[${newVersion}]: ${repoUrl}/compare/${lastVersion}...v${newVersion}\n`
    );
  }
  
  fs.writeFileSync(changelogPath, changelog);
  console.log('✅ Updated CHANGELOG.md');
}

// Update README.md version badge
const readmePath = path.join(PROJECT_ROOT, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Update version badge
  readme = readme.replace(
    /version-[\d\.]+-?[a-zA-Z0-9]*-blue/,
    `version-${newVersion.replace(/\./g, '.')}-blue`
  );
  
  // Update any version references in headers
  readme = readme.replace(
    /v\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?/g,
    `v${newVersion}`
  );
  
  fs.writeFileSync(readmePath, readme);
  console.log('✅ Updated README.md');
}

// Build the project
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

console.log(`\n🎉 Version bump complete!`);
console.log(`📦 New version: ${newVersion}`);
console.log(`\nNext steps:`);
console.log(`1. Review the changes`);
console.log(`2. git add -A && git commit -m "chore: bump version to ${newVersion}"`);
console.log(`3. git tag v${newVersion}`);
console.log(`4. git push origin dev --tags`);
console.log(`5. Create pull request to main`);