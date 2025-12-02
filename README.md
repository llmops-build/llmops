# LLMOps TypeScript Workspace

A pluggable LLMOps open source project designed for TypeScript teams with developer experience as a priority.

## Getting Started

### Prerequisites

- Node.js (recommended version: latest LTS)
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
# Start development mode
pnpm run dev

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Lint code
pnpm run lint

# Type check
pnpm run typecheck

# Clean build artifacts
pnpm run clean
```

### Workspace Management

This project uses pnpm workspaces with packages in the `packages/` directory.

```bash
# Add dependency to specific workspace
pnpm add <package> --filter <workspace>

# Run script in specific workspace
pnpm run <script> --filter <workspace>
```

## Project Structure

```
llmops/
├── packages/          # Workspace packages
├── CLAUDE.md         # Development guidelines
└── README.md         # This file
```

## Development Guidelines

- Always run linting and type checking before commits
- Use TypeScript strict mode
- Follow existing code conventions and patterns
- Prioritize developer experience in all implementations