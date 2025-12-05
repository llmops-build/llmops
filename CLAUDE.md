# LLMOps TypeScript Workspace

## Project Structure

- This is a pnpm workspace with packages stored in the `packages/` directory
- Use pnpm for all package management operations

### Packages

- **@llmops/core**: Core functionality with providers, schemas, and types
- **@llmops/sdk**: SDK with Express middleware and integrations
- **@llmops/app**: Full-stack Hono app with Vite, React SSR, and API handlers
- **@llmops/ui**: Component library with Storybook and StyleX

### Examples

- **express**: Express server example with UI demo for testing API endpoints

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
- **Dev packages only**: `pnpm run dev:packages`
- **Format code**: `pnpm run format`
- **Format check**: `pnpm run format:check`

### Provider System

- **OpenRouter**: Integrated LLM provider with OpenAI compatibility
- **API Endpoints**: GenAI chat completions, models, and validation
- **Middleware**: Provider initialization and context injection

## Important Notes

- Always run linting and type checking before commits
- Use TypeScript strict mode
- Follow existing code conventions and patterns
- This is a Pluggable LLMOps OpenSource project
- For TypeScript teams where DX will be priority

## Architecture

- **Frontend**: React with SSR via Hono and Vite
- **Backend**: Hono server with Express middleware support
- **Styling**: StyleX with component library and global styles
- **Development**: Storybook for component development
- **Build**: TypeScript with tsdown for optimized builds