/**
 * Commitlint Configuration
 * Enforces Conventional Commits specification
 * https://www.conventionalcommits.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following (added 'patch' for patch releases)
    'type-enum': [
      1, // Changed from 2 (error) to 1 (warning)
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Code style (formatting, semicolons, etc)
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Adding or updating tests
        'build',    // Build system or dependencies
        'ci',       // CI/CD configuration
        'chore',    // Maintenance tasks
        'revert',   // Revert previous commit
        'wip',      // Work in progress (not recommended for main)
        'patch',    // Patch release (added for flexibility)
      ],
    ],
    // Type must be lowercase (warning instead of error)
    'type-case': [1, 'always', 'lower-case'],
    // Type cannot be empty (keep as error)
    'type-empty': [2, 'never'],
    // Subject must be lowercase (warning instead of error)
    'subject-case': [1, 'always', 'lower-case'],
    // Subject cannot be empty (keep as error)
    'subject-empty': [2, 'never'],
    // Subject cannot end with period (keep as error)
    'subject-full-stop': [2, 'never', '.'],
    // Header max length increased to 120 characters (from 100)
    'header-max-length': [2, 'always', 120],
    // Body max line length increased to 120 characters (from 100)
    'body-max-line-length': [1, 'always', 120],
    // Footer max line length increased to 120 characters (from 100)
    'footer-max-line-length': [1, 'always', 120],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
