#!/usr/bin/env node

import { run } from '@drizzle-team/brocli';
import { generateCommand } from './commands/generate.js';

const commands = [generateCommand];

run(commands, {
  name: 'llmops',
  description: 'LLMOps CLI - A pluggable LLMOps toolkit for TypeScript teams',
  version: '0.0.1',
});
