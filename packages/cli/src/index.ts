#!/usr/bin/env node

import { run } from '@drizzle-team/brocli';
import { migrateCommand } from './commands/migrate';
import { tuiCommand } from './commands/tui';
import { evalCommand } from './commands/eval';

const commands = [migrateCommand, tuiCommand, evalCommand];

run(commands, {
  name: 'llmops',
  description: 'LLMOps CLI - A pluggable LLMOps toolkit for TypeScript teams',
  version: '0.0.1',
});
