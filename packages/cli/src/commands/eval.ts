import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import {
  boolean as booleanOption,
  command,
  number as numberOption,
  string,
} from '@drizzle-team/brocli';
import type { EvaluateResult, GateResult } from '@llmops/sdk/eval';
import { applyGate } from '@llmops/sdk/eval';
import chalk from 'chalk';
import {
  buildJsonOutput,
  byEvalName,
  EXIT_EVAL_ERROR,
  loadLatestResults,
  parseMaxRegression,
  parseMinScoreSpec,
  resolveExitCode,
} from '../lib/gate';
import { printGateReport } from '../lib/gate-report';

/**
 * Find eval files from a path (file or directory).
 * Default pattern: *.eval.ts, *.eval.js
 */
function findEvalFiles(target: string): string[] {
  const resolved = resolve(target);

  if (!existsSync(resolved)) {
    console.error(chalk.red(`Path not found: ${target}`));
    process.exit(EXIT_EVAL_ERROR);
  }

  const stat = statSync(resolved);

  if (stat.isFile()) {
    return [resolved];
  }

  if (stat.isDirectory()) {
    return collectEvalFiles(resolved);
  }

  return [];
}

function collectEvalFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      entry.name !== 'node_modules'
    ) {
      files.push(...collectEvalFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.eval.ts') || entry.name.endsWith('.eval.js'))
    ) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * Bundle and run an eval file using esbuild.
 * Bundles to a temp file, executes with node, then cleans up.
 */
async function bundleAndRun(
  file: string,
  env: Record<string, string | undefined>,
  jsonOutput: boolean,
): Promise<string | undefined> {
  const esbuild = await import('esbuild');

  const tmpDir = join(process.cwd(), '.llmops-eval-tmp');
  mkdirSync(tmpDir, { recursive: true });
  const outFile = join(
    tmpDir,
    `${basename(file, '.ts').replace('.eval', '')}_eval.mjs`,
  );

  try {
    await esbuild.build({
      entryPoints: [file],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: outFile,
      external: [
        '@llmops/sdk',
        '@llmops/sdk/*',
        '@llmops/core',
        '@llmops/core/*',
        'openai',
        'esbuild',
        'fsevents',
        'dotenv',
        'dotenv/*',
      ],
      treeShaking: true,
      sourcemap: false,
      banner: {
        // Shim for import.meta in node
        js: '',
      },
    });

    if (jsonOutput) {
      return execFileSync(process.execPath, [outFile], {
        stdio: ['ignore', 'pipe', 'inherit'],
        encoding: 'utf8',
        env: env as Record<string, string>,
        cwd: process.cwd(),
      });
    }

    execFileSync(process.execPath, [outFile], {
      stdio: 'inherit',
      env: env as Record<string, string>,
      cwd: process.cwd(),
    });
    return undefined;
  } finally {
    // Clean up temp files
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}

export const evalCommand = command({
  name: 'eval',
  desc: 'Run evaluation files',
  options: {
    target: string()
      .default('./evals')
      .desc('File or directory to run. Default: ./evals')
      .alias('t'),
    outputDir: string()
      .default('./llmops-evals')
      .desc('Output directory for results')
      .alias('o'),
    json: booleanOption().desc('Output results as JSON to stdout').alias('j'),
    minScore: string()
      .desc(
        'Fail if an evaluator\'s mean score is below a threshold. Format: "evaluator=threshold[,evaluator=threshold...]"',
      )
      .alias('m'),
    baseline: string()
      .desc(
        "Directory of baseline eval results (e.g. a previous run's --outputDir) to check for score regressions",
      )
      .alias('b'),
    maxRegression: numberOption()
      .desc(
        "Max allowed drop in an evaluator's mean score vs --baseline before failing. Requires --baseline. Default: 0",
      )
      .alias('r'),
  },
  handler: async (opts) => {
    const target = opts.target;
    const jsonOutput = opts.json === true;

    // Validate gate configuration before touching the filesystem or running
    // anything, so a misconfigured flag fails immediately rather than after a
    // full (and potentially paid) eval run.
    let minScoreThresholds: Record<string, number> | undefined;
    let maxRegression = 0;
    let baselineResults: Record<string, EvaluateResult> | undefined;

    try {
      if (opts.maxRegression !== undefined && !opts.baseline) {
        throw new Error('--maxRegression requires --baseline to be set.');
      }

      minScoreThresholds = opts.minScore
        ? parseMinScoreSpec(opts.minScore)
        : undefined;
      maxRegression = parseMaxRegression(opts.maxRegression);

      if (opts.baseline) {
        const baselineDir = resolve(opts.baseline);
        if (!existsSync(baselineDir)) {
          throw new Error(`Baseline directory not found: ${opts.baseline}`);
        }

        const loaded = loadLatestResults(baselineDir);
        if (loaded.length === 0) {
          throw new Error(
            `Baseline directory contains no eval results: ${opts.baseline}`,
          );
        }
        baselineResults = byEvalName(loaded);
      }
    } catch (err) {
      console.error(
        chalk.red(err instanceof Error ? err.message : String(err)),
      );
      process.exit(EXIT_EVAL_ERROR);
    }

    const gateEnabled = Boolean(minScoreThresholds || baselineResults);
    const files = findEvalFiles(target);

    if (files.length === 0) {
      console.error(
        chalk.yellow(
          `No eval files found. Create files matching *.eval.ts or *.eval.js in ${target}`,
        ),
      );
      process.exit(EXIT_EVAL_ERROR);
    }

    if (!jsonOutput) {
      console.log(
        chalk.dim(
          `Found ${files.length} eval file${files.length > 1 ? 's' : ''}`,
        ),
      );
    }

    const env: Record<string, string | undefined> = {
      ...process.env,
      LLMOPS_EVAL_OUTPUT_DIR: resolve(opts.outputDir),
      ...(jsonOutput ? { LLMOPS_EVAL_OUTPUT: 'json' } : {}),
    };

    let hasErrors = false;
    const jsonResults: unknown[] = [];
    const runStartedAt = Date.now();

    for (const file of files) {
      const name = basename(file);
      if (!jsonOutput) {
        console.log(chalk.dim(`\nRunning ${name}...`));
      }

      try {
        const output = await bundleAndRun(file, env, jsonOutput);
        if (jsonOutput && output) {
          jsonResults.push(JSON.parse(output));
        }
      } catch (err) {
        hasErrors = true;
        console.error(chalk.red(`\n✗ ${name} failed`));
        if (err instanceof Error && !('status' in err)) {
          console.error(err.message);
        }
      }
    }

    // Run the CI gate against the results this invocation just produced.
    // Reads back from outputDir (evaluate() always saves there) instead of
    // requiring --json, so thresholds and baselines work in either mode.
    let gate: GateResult | undefined;
    if (gateEnabled && !hasErrors) {
      try {
        gate = applyGate(
          loadLatestResults(resolve(opts.outputDir), runStartedAt),
          {
            minScore: minScoreThresholds,
            baseline: baselineResults,
            maxRegression,
          },
        );
      } catch (err) {
        console.error(
          chalk.red(err instanceof Error ? err.message : String(err)),
        );
        process.exit(EXIT_EVAL_ERROR);
      }
    }

    if (jsonOutput) {
      const output = buildJsonOutput(jsonResults, gate);
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    }

    // Print summary
    const outputDir = resolve(opts.outputDir);
    if (existsSync(outputDir) && !jsonOutput) {
      const evalDirs = readdirSync(outputDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      if (evalDirs.length > 0) {
        console.log(chalk.dim('\n─────────────────────────────────'));
        console.log(chalk.dim(`Results saved to ${opts.outputDir}/`));

        for (const evalDir of evalDirs) {
          const resultFiles = readdirSync(join(outputDir, evalDir))
            .filter((f) => f.endsWith('.json'))
            .sort()
            .reverse();

          if (resultFiles.length > 0) {
            try {
              const data = JSON.parse(
                readFileSync(join(outputDir, evalDir, resultFiles[0]), 'utf-8'),
              );
              const scores = data.scores as Record<string, { mean: number }>;
              const scoreStr = Object.entries(scores)
                .map(([k, v]) => `${k}=${v.mean.toFixed(2)}`)
                .join('  ');
              console.log(`  ${chalk.white(evalDir)}  ${chalk.cyan(scoreStr)}`);
            } catch {
              console.log(
                `  ${chalk.white(evalDir)}  ${chalk.dim(resultFiles[0])}`,
              );
            }
          }
        }
      }
    }

    if (gate && !jsonOutput) {
      printGateReport(gate);
    }

    const exitCode = resolveExitCode({ hasErrors, gate });
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  },
});
