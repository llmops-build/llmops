import { command, string, boolean as booleanOption } from '@drizzle-team/brocli';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';

/**
 * Find eval files from a path (file or directory).
 * Default pattern: *.eval.ts, *.eval.js
 */
function findEvalFiles(target: string): string[] {
  const resolved = resolve(target);

  if (!existsSync(resolved)) {
    console.error(chalk.red(`Path not found: ${target}`));
    process.exit(1);
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
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
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
): Promise<void> {
  const esbuild = await import('esbuild');

  const tmpDir = join(process.cwd(), '.llmops-eval-tmp');
  mkdirSync(tmpDir, { recursive: true });
  const outFile = join(tmpDir, `${basename(file, '.ts').replace('.eval', '')}_eval.mjs`);

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
      ],
      treeShaking: true,
      sourcemap: false,
      banner: {
        // Shim for import.meta in node
        js: '',
      },
    });

    execSync(`node ${outFile}`, {
      stdio: 'inherit',
      env: env as Record<string, string>,
      cwd: process.cwd(),
    });
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
      .desc('File or directory to run. Default: ./evals'),
    outputDir: string()
      .default('./llmops-evals')
      .desc('Output directory for results')
      .alias('o'),
    json: booleanOption()
      .desc('Output results as JSON to stdout')
      .alias('j'),
  },
  handler: async (opts) => {
    const target = opts.target;
    const files = findEvalFiles(target);

    if (files.length === 0) {
      console.error(
        chalk.yellow(
          `No eval files found. Create files matching *.eval.ts or *.eval.js in ${target}`,
        ),
      );
      process.exit(1);
    }

    console.log(
      chalk.dim(`Found ${files.length} eval file${files.length > 1 ? 's' : ''}`),
    );

    const env: Record<string, string | undefined> = {
      ...process.env,
      LLMOPS_EVAL_OUTPUT_DIR: resolve(opts.outputDir),
      ...(opts.json ? { LLMOPS_EVAL_OUTPUT: 'json' } : {}),
    };

    let hasErrors = false;

    for (const file of files) {
      const name = basename(file);
      console.log(chalk.dim(`\nRunning ${name}...`));

      try {
        await bundleAndRun(file, env);
      } catch (err) {
        hasErrors = true;
        console.error(chalk.red(`\n✗ ${name} failed`));
        if (err instanceof Error && !('status' in err)) {
          console.error(err.message);
        }
      }
    }

    // Print summary
    const outputDir = resolve(opts.outputDir);
    if (existsSync(outputDir) && !opts.json) {
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
              console.log(`  ${chalk.white(evalDir)}  ${chalk.dim(resultFiles[0])}`);
            }
          }
        }
      }
    }

    if (hasErrors) {
      process.exit(1);
    }
  },
});
