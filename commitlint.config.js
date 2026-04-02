/**
 * Commitlint Configuration
 * Enforces Conventional Commits specification
 * https://www.conventionalcommits.org/
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
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
      ],
    ],
    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
    // Type cannot be empty
    'type-empty': [2, 'never'],
    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],
    // Subject cannot be empty
    'subject-empty': [2, 'never'],
    // Subject cannot end with period
    'subject-full-stop': [2, 'never', '.'],
    // Header max length 100 characters
    'header-max-length': [2, 'always', 100],
    // Body max line length 100 characters
    'body-max-line-length': [2, 'always', 100],
    // Footer max line length 100 characters
    'footer-max-line-length': [2, 'always', 100],
  },
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
};
