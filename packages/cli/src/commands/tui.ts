import { command, string } from '@drizzle-team/brocli';
import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
} from '@opentui/core';
import { existsSync } from 'node:fs';
import type { LLMOpsConfig } from '@llmops/core';
import { getConfig } from '../lib/get-config';

type Store = {
  queryRequests: (filters: {
    limit: number;
  }) => Promise<Array<{ id: string; model?: string }>>;
};

function getStore(config: LLMOpsConfig | undefined): Store | undefined {
  const telemetry = config?.telemetry;
  const dest = Array.isArray(telemetry) ? telemetry[0] : telemetry;
  if (dest && typeof dest === 'object' && 'queryRequests' in dest) {
    return dest as unknown as Store;
  }
  return undefined;
}

async function renderTui(config: LLMOpsConfig | undefined): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: true });

  const root = new BoxRenderable(renderer, {
    id: 'root',
    border: true,
    borderStyle: 'rounded',
    padding: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  });

  root.add(
    new TextRenderable(renderer, {
      id: 'title',
      content: 'LLMOps TUI',
      fg: '#00FF88',
    }),
  );
  root.add(
    new TextRenderable(renderer, {
      id: 'hint',
      content: 'Press Ctrl+C to exit',
      fg: '#888888',
    }),
  );

  const store = getStore(config);

  if (!config) {
    root.add(
      new TextRenderable(renderer, {
        id: 'no-config',
        content: 'No config provided.',
        fg: '#FFAA00',
      }),
    );
  } else if (!store) {
    root.add(
      new TextRenderable(renderer, {
        id: 'no-store',
        content: 'No Store configured in telemetry.',
        fg: '#FFAA00',
      }),
    );
  } else {
    try {
      const rows = await store.queryRequests({ limit: 10 });
      root.add(
        new TextRenderable(renderer, {
          id: 'count',
          content: `Recent requests: ${rows.length}`,
          fg: '#00BFFF',
        }),
      );
      rows.slice(0, 10).forEach((row, i) => {
        root.add(
          new TextRenderable(renderer, {
            id: `row-${i}`,
            content: `${i + 1}. ${row.id}${row.model ? ` (${row.model})` : ''}`,
            fg: '#DDDDDD',
          }),
        );
      });
    } catch (err) {
      root.add(
        new TextRenderable(renderer, {
          id: 'err',
          content: `Query failed: ${(err as Error).message}`,
          fg: '#FF5555',
        }),
      );
    }
  }

  renderer.root.add(root);
  renderer.requestRender();
}

export const tuiCommand = command({
  name: 'tui',
  desc: 'Open the LLMOps terminal dashboard',
  options: {
    cwd: string()
      .default(process.cwd())
      .desc('Current working directory')
      .alias('d'),
    config: string().desc('Path to the LLMOps config file').alias('c'),
  },
  handler: async (opts) => {
    const cwd = opts.cwd;
    const configPath = opts.config;

    let config: LLMOpsConfig | undefined;
    if (configPath) {
      if (!existsSync(cwd)) {
        console.error(`The specified directory does not exist: ${cwd}`);
        process.exit(1);
      }
      config = await getConfig({ configPath, cwd });
    }

    await renderTui(config);
  },
});
