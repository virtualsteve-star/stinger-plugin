module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, missing semicolons, etc
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Changes to build system
        'ci',       // Changes to CI configuration
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Revert previous commit
        'security', // Security fixes
        'deps',     // Dependency updates
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-enum': [
      2,
      'always',
      [
        'content',    // Content script changes
        'background', // Background worker changes
        'popup',      // Popup UI changes
        'api',        // API client changes
        'types',      // Type definitions
        'config',     // Configuration files
        'ci',         // CI/CD changes
        'docs',       // Documentation
        'test',       // Test files
        'build',      // Build system
        'deps',       // Dependencies
      ],
    ],
  },
};