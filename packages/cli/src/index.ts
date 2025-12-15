#!/usr/bin/env node

import { run } from '@drizzle-team/brocli';
import { migrateCommand } from './commands/migrate';

const commands = [migrateCommand];

run(commands, {
  name: 'llmops',
  description: 'LLMOps CLI - A pluggable LLMOps toolkit for TypeScript teams',
  version: '0.0.1',
});
