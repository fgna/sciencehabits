# Contributing to ScienceHabits

We love your input! We want to make contributing to ScienceHabits as easy and transparent as possible.

## Development Process

We use GitHub to sync code, track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Contribution Standards

### Code Style

- **TypeScript**: All code must be properly typed
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code formatting is handled automatically
- **Conventional Commits**: Use conventional commit messages

### Testing Requirements

- **Unit Tests**: All new components and utilities must have tests
- **Accessibility**: New UI components must pass accessibility tests
- **E2E Tests**: Major features should include end-to-end test scenarios
- **Coverage**: Maintain or improve test coverage (target: >80%)

### Quality Gates

Before your PR can be merged, it must:

- ✅ Pass all automated tests
- ✅ Meet accessibility standards (WCAG 2.1 AA)
- ✅ Pass TypeScript compilation
- ✅ Pass ESLint validation
- ✅ Maintain or improve test coverage
- ✅ Include appropriate documentation

## Getting Started

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/sciencehabits/app.git
   cd sciencehabits
   npm install
   npm start
   ```

2. **Run Tests**
   ```bash
   npm test                 # Unit tests
   npm run test:a11y       # Accessibility tests
   npm run cypress:open    # E2E tests
   ```

3. **Code Quality Checks**
   ```bash
   npm run lint            # Linting
   npm run type-check      # TypeScript
   npm run test:coverage   # Coverage
   ```

## Issue Reporting

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/sciencehabits/app/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening)

## Feature Requests

We're always looking for suggestions to improve ScienceHabits. Please use [GitHub Discussions](https://github.com/sciencehabits/app/discussions) for feature requests.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.