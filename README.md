<p align="center">
    <picture>
        <source srcset="./llmops-header-dark.png" media="(prefers-color-scheme: dark)">
        <source srcset="./llmops-header.png" media="(prefers-color-scheme: light)">
        <img src="./llmops-header.png" alt="LLMOps Header">
    </picture>
    <h2 align="center">
        LLMOps
    </h2>
    <p align="center">  
    A pluggable LLMOps toolkit for TypeScript applications. 
      <br />
      <a href="https://llmops.build"><strong>Learn more »</strong></a>
      <br />
      <br />
      <a href="https://discord.gg/8teSTfmEKU">Discord</a>
      ·
      <a href="https://github.com/llmops-build/llmops/issues">Issues</a>
    </p>
</p>

[![npm](https://img.shields.io/npm/dm/@llmops/sdk?style=flat&colorA=000000&colorB=000000)](https://npm.chart.dev/@llmops/sdk?primary=neutral&gray=neutral&theme=dark)
[![npm version](https://img.shields.io/npm/v/@llmops/sdk.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@llmops/sdk?primary=neutral&gray=neutral&theme=dark)
[![GitHub stars](https://img.shields.io/github/stars/llmops-build/llmops?style=flat&colorA=000000&colorB=000000)](https://github.com/llmops-build/llmops/stargazers)

### Deploy Standalone LLMOps

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/llmops?referralCode=RgsWj1&utm_medium=integration&utm_source=template&utm_campaign=generic)

## About the Project

LLMOps is an open-source, pluggable toolkit designed for TypeScript teams to streamline LLM operations with a focus on developer experience. It provides a comprehensive solution for integrating, managing, and monitoring Large Language Model providers in your applications.

### Key Features

- **AI Gateway**: OpenAI-compatible API that routes to a broad range of LLM providers. Drop-in replacement — change the base URL and it works with any OpenAI SDK client.
- **Observability**: Full request/response logging, cost tracking, performance monitoring, and distributed traces with spans.
- **Telemetry Stores**: Postgres, SQLite, or Cloudflare D1. Raw SQL, no ORM. Migrations run automatically or via CLI.
- **Evals**: Code-first evaluation with `evaluate()`, `judgeScorer()`, and `compare()`. Results stored as version-controllable JSON files.
- **TypeScript-First**: Strict-mode TypeScript with excellent type safety and developer experience

Visit our [documentation](https://llmops.build/docs) for detailed setup instructions and examples.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

Whether you're fixing bugs, improving documentation, or proposing new features, we appreciate your help in making LLMOps better.
