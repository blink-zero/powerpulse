# Contributing to PowerPulse

Thank you for your interest in contributing to PowerPulse! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```
   git clone https://github.com/YOUR-USERNAME/powerpulse.git
   cd powerpulse
   ```
3. Add the original repository as a remote to keep your fork in sync:
   ```
   git remote add upstream https://github.com/blink-zero/powerpulse.git
   ```
4. Install dependencies:
   ```
   npm run install-all
   ```
5. Create a new branch for your feature or bugfix:
   ```
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make sure your fork is up to date:
   ```
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. Create a new branch for your changes:
   ```
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Test your changes locally
5. Commit your changes with a descriptive commit message
6. Push your branch to your fork:
   ```
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request from your fork to the main repository

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the documentation if necessary
3. Include tests for your changes if applicable
4. Ensure all tests pass
5. Update the CHANGELOG.md with details of your changes
6. The PR will be merged once it has been reviewed and approved by a maintainer

## Coding Standards

- Follow the existing code style in the project
- Use meaningful variable and function names
- Write comments for complex logic
- Keep functions small and focused on a single task
- Use ES6+ features where appropriate
- Format your code using the project's linting rules

### JavaScript/React Guidelines

- Use functional components with hooks instead of class components
- Use destructuring for props and state
- Use async/await for asynchronous operations
- Prefer named exports over default exports
- Use PropTypes for component props

### CSS Guidelines

- Use the existing CSS/Tailwind approach
- Follow the BEM naming convention for custom CSS classes
- Keep selectors as simple as possible
- Use variables for colors, spacing, etc.

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for your commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types include:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Changes that do not affect the meaning of the code
- refactor: Code changes that neither fix a bug nor add a feature
- perf: Performance improvements
- test: Adding or fixing tests
- chore: Changes to the build process or auxiliary tools

## Testing

- Write tests for new features and bug fixes
- Run the existing test suite before submitting a PR:
  ```
  npm test
  ```
- Aim for good test coverage of your code

## Documentation

- Update the README.md if you change functionality
- Document new features in the appropriate documentation files
- Use JSDoc comments for functions and components
- Keep API documentation up to date

Thank you for contributing to PowerPulse!
