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

## API Development Workflow

### Adding New API Endpoints and Client Hooks

When adding new API functionality, follow this end-to-end workflow:

1. **Data Layer** (`packages/core/src/datalayer/`)
   - Add database methods with Zod validation schemas
   - Methods should handle CRUD operations with proper error handling

2. **Server Handler** (`packages/app/src/server/handlers/`)
   - Create Hono routes with `zv` middleware for validation
   - Use `successResponse()` and `internalServerError()` from `@shared/responses`
   - Common patterns:
     - `POST /` - Create new resource
     - `GET /` - List resources
     - `GET /:id` - Get single resource
     - `PATCH /:id` - Update resource
     - `DELETE /:id` - Delete resource

3. **Client Hooks** (`packages/app/src/client/hooks/`)
   - **Queries** (`queries/`): Use `useQuery` for GET requests
   - **Mutations** (`mutations/`): Use `useMutation` for POST/PATCH/DELETE
   - Import Hono client from `@client/lib/hc`
   - Type responses using `Exclude<Awaited<ReturnType<typeof response.json>>, JSONValue>` to remove generic JSONValue type
   - Extract `.data` field from API responses

**Example Query Hook:**
```typescript
export const useConfigList = () => {
  return useQuery({
    queryKey: ['configs-list'],
    queryFn: async () => {
      const response = await hc.v1.configs.$get();
      return (await response.json()).data;
    },
  });
};
```

**Example Mutation Hook:**
```typescript
export const useCreateConfig = () => {
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await hc.v1.configs.$post({
        form: { name: data.name },
      });
      return (await response.json()).data;
    },
  });
};
```
