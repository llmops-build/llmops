# LLMOps TypeScript Workspace

## Project Structure

- This is a pnpm workspace with packages stored in the `packages/` directory
- Use pnpm for all package management operations

## Development Guidelines

### Package Management

- **Install dependencies**: `pnpm install`
- **Add workspace dependency**: `pnpm add <package> --filter <workspace>`
- **Run scripts**: `pnpm run <script> --filter <workspace>`

### Code Quality

- **Lint**: `pnpm run lint`
- **Type check**: `pnpm run typecheck`
- **Test**: `pnpm run test`

### Workspace Commands

- **Build all**: `pnpm run build`
- **Clean**: `pnpm run clean`
- **Dev mode**: `pnpm run dev`

## Important Notes

- Always run linting and type checking before commits
- Use TypeScript strict mode
- Follow existing code conventions and patterns
- This is a Pluggable LLMOps OpenSource project
- For TypeScript teams where DX will be priority