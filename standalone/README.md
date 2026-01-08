# LLMOps Standalone Application

A containerized standalone application that integrates LLMOps using the `@llmops/sdk` package.

## Quick Start

### Using Docker

1. Build the Docker image:
```bash
docker build -t llmops-standalone .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e POSTGRES_URL="your_postgres_connection_string" llmops-standalone
```

### Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run in development mode:
```bash
pnpm dev
```

4. Build for production:
```bash
pnpm build
pnpm start
```

## Environment Variables

- `POSTGRES_URL`: PostgreSQL connection string (required)
- `OPENROUTER_API_KEY`: OpenRouter API key for LLM access
- `PORT`: Server port (default: 3000)

## Endpoints

- `/`: Application info
- `/health`: Health check
- `/llmops`: LLMOps dashboard and API

## Default Dashboard Access

- URL: `http://localhost:3000/llmops`
- Username: `admin@llmops.local`
- Password: `password`