# Contributing to LLMOps

Thank you for your interest in contributing to LLMOps. This guide will help you get started with the contribution process.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Project Structure

The LLMOps monorepo is organized as follows:

- `/packages/core` - Core functionality with providers, schemas, and types
- `/packages/sdk` - SDK with middleware integrations for Express, Hono, and other frameworks
- `/packages/app` - Full-stack application with React SSR, API handlers, and dashboard UI
- `/packages/gateway` - AI Gateway with provider routing, plugins, and request handling
- `/packages/cli` - Command-line interface tools
- `/docs` - Documentation website
- `/examples` - Example applications

## Development Guidelines

When contributing to LLMOps:

- Keep changes focused. Large PRs are harder to review and unlikely to be accepted. We recommend opening an issue and discussing it with us first.
- Ensure all code is type-safe and takes full advantage of TypeScript features.
- Write clear, self-explanatory code. Use comments only when truly necessary.
- Maintain a consistent and predictable API across all supported frameworks.
- Follow the existing code style and conventions.
- We aim for stability, so avoid changes that would require users to run a migration or update their config without prior discussion.

## Getting Started

1. Fork the repository to your GitHub account
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/llmops.git
   cd llmops
   ```
3. Install Node.js (LTS version recommended)

4. Install `pnpm` if you haven't already:

   > **Note:** This project uses [pnpm](https://pnpm.io/) as the package manager.

   ```bash
   npm install -g pnpm
   ```

5. Install project dependencies:

   ```bash
   pnpm install
   ```

6. Build the project:

   ```bash
   pnpm build
   ```

7. Run in development mode:
   ```bash
   pnpm dev
   ```

## Code Formatting

We use Prettier and ESLint for code formatting and linting. Before committing, please ensure your code is properly formatted:

```bash
# Format all code
pnpm format

# Check formatting
pnpm format:check

# Run linting
pnpm lint

# Type check
pnpm typecheck
```

## Development Workflow

1. Create a new branch for your changes:

   ```bash
   git checkout -b type/description
   # Example: git checkout -b feat/new-provider
   ```

   Branch type prefixes:
   - `feat/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation changes
   - `refactor/` - Code refactoring
   - `test/` - Test-related changes
   - `chore/` - Build process or tooling changes

2. Make your changes following the code style guidelines
3. Add tests for your changes
4. Run the test suite:

   ```bash
   # Run all tests
   pnpm test

   # Run tests for a specific package
   pnpm test --filter @llmops/core
   ```

5. Ensure all tests pass and the code is properly formatted
6. Commit your changes with a descriptive message following this format:

   For changes that need to be included in the changelog, use the `fix` or `feat` format with a specific scope:

   ```
   fix(gateway): fix incorrect provider routing

   feat(sdk): add support for streaming responses
   ```

   For core library changes that don't have a specific plugin or scope:

   ```
   fix: resolve memory leak in request handling

   feat: add support for custom middleware
   ```

   For documentation changes, use `docs`:

   ```bash
   docs: improve quickstart guide
   docs: fix typos in API reference
   ```

   For changes that refactor or don't change the functionality:

   ```bash
   chore(refactor): reorganize provider handlers
   chore: update dependencies to latest versions
   ```

7. Push your branch to your fork
8. Open a pull request against the **main** branch. In your PR description:
   - Clearly describe what changes you made and why
   - Include any relevant context or background
   - List any breaking changes or deprecations
   - Add screenshots for UI changes
   - Reference related issues or discussions

## Testing

All contributions must include appropriate tests. Follow these guidelines:

- Write unit tests for new features
- Ensure all tests pass before submitting a pull request
- Update existing tests if your changes affect their behavior
- Follow the existing test patterns and structure
- Test across different environments when applicable

## Pull Request Process

1. Create a draft pull request early to facilitate discussion
2. Reference any related issues in your PR description (e.g., 'Closes #123')
3. Ensure all tests pass and the build is successful
4. Update documentation as needed
5. Keep your PR focused on a single feature or bug fix
6. Be responsive to code review feedback

## Code Style

- Follow the existing code style
- Use TypeScript types and interfaces effectively
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Update relevant documentation when making API changes
- Follow Prettier formatting rules

## Package-Specific Guidelines

### Core Library (`/packages/core`)

- Keep the core library focused on essential LLM operations functionality
- Ensure all public APIs are well-documented with JSDoc comments
- Maintain backward compatibility when possible
- Follow the existing patterns for error handling

### Gateway (`/packages/gateway`)

- New provider integrations should follow the existing provider patterns
- Plugins should be self-contained and well-documented
- Test provider integrations thoroughly

### SDK (`/packages/sdk`)

- Maintain framework-agnostic patterns where possible
- Ensure middleware works consistently across supported frameworks
- Keep the public API surface minimal and intuitive

### Documentation (`/docs`)

- Keep documentation up-to-date with code changes
- Use clear, concise language
- Include code examples for common use cases
- Document any breaking changes in migration guides
- Follow the existing documentation style and structure

## Security Issues

For security-related issues, please open a private security advisory on GitHub. Include a detailed description of the vulnerability and steps to reproduce it. All reports will be reviewed and addressed promptly.

## Questions?

If you have questions or need help, feel free to:

- Open a [GitHub issue](https://github.com/llmops-build/llmops/issues)
- Join our [Discord community](https://discord.gg/8teSTfmEKU)
