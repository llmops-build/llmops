FROM node:24-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy standalone app files
COPY standalone/package.json standalone/tsconfig.json ./
COPY standalone/src ./src

# For CI/CD, we'll update package.json to use published packages
# This step will be handled by the workflow

# Install dependencies (will use published @llmops/sdk in CI)
RUN pnpm install

# Build the application
RUN pnpm run build

FROM node:24-alpine AS runtime

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY standalone/package.json ./

# Install production dependencies
RUN pnpm install --prod

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["pnpm", "start"]
