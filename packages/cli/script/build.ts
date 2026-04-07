#!/usr/bin/env bun
/**
 * Build script for @llmops/cli — produces self-contained Bun binaries
 * for one or more target platforms via `bun build --compile`.
 *
 * Modeled on opencode's packages/opencode/script/build.ts.
 *
 * Usage:
 *   bun run script/build.ts             # all targets (CI)
 *   bun run script/build.ts --single    # current platform only (dev)
 *   bun run script/build.ts --skip-install
 */
import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, '..');
process.chdir(dir);

const pkg = await Bun.file(path.join(dir, 'package.json')).json();

const singleFlag = process.argv.includes('--single');
const skipInstall = process.argv.includes('--skip-install');

type Target = {
  os: 'linux' | 'darwin' | 'win32';
  arch: 'x64' | 'arm64';
  abi?: 'musl';
  avx2?: false;
};

const allTargets: Target[] = [
  { os: 'linux', arch: 'arm64' },
  { os: 'linux', arch: 'x64' },
  { os: 'linux', arch: 'x64', avx2: false },
  { os: 'linux', arch: 'arm64', abi: 'musl' },
  { os: 'linux', arch: 'x64', abi: 'musl' },
  { os: 'linux', arch: 'x64', abi: 'musl', avx2: false },
  { os: 'darwin', arch: 'arm64' },
  { os: 'darwin', arch: 'x64' },
  { os: 'darwin', arch: 'x64', avx2: false },
  { os: 'win32', arch: 'arm64' },
  { os: 'win32', arch: 'x64' },
  { os: 'win32', arch: 'x64', avx2: false },
];

const targets: Target[] = singleFlag
  ? allTargets.filter((t) => {
      if (t.os !== process.platform || t.arch !== process.arch) return false;
      // Skip baseline + abi-specific variants for local --single dev builds.
      if (t.avx2 === false) return false;
      if (t.abi !== undefined) return false;
      return true;
    })
  : allTargets;

if (targets.length === 0) {
  console.error(
    `No matching target for current platform ${process.platform}/${process.arch}`,
  );
  process.exit(1);
}

await $`rm -rf dist`.nothrow();

// For cross-compile we need ALL platform-specific @opentui/core native
// sub-packages installed locally so each compile target can resolve them.
// Skipped for --single since the current platform's package is already there.
if (!skipInstall && !singleFlag) {
  const opentuiVersion = pkg.dependencies['@opentui/core'];
  await $`bun install --os="*" --cpu="*" @opentui/core@${opentuiVersion}`;
}

// Locate the OpenTUI tree-sitter parser worker. It must be passed as a
// separate entrypoint so Bun.build embeds it; OpenTUI loads it at runtime
// via OTUI_TREE_SITTER_WORKER_PATH.
function resolveOpentuiCoreDir(): string {
  // import.meta.resolve returns a file:// URL to the package's main entry.
  const url = import.meta.resolve('@opentui/core');
  const mainPath = fileURLToPath(url);
  // Walk up until we find package.json.
  let cur = path.dirname(mainPath);
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'package.json'))) {
      const pj = JSON.parse(
        fs.readFileSync(path.join(cur, 'package.json'), 'utf8'),
      );
      if (pj.name === '@opentui/core') return cur;
    }
    cur = path.dirname(cur);
  }
  throw new Error('Could not locate @opentui/core package directory');
}

const opentuiCoreDir = resolveOpentuiCoreDir();
const parserWorker = fs.realpathSync(
  path.join(opentuiCoreDir, 'parser.worker.js'),
);
console.log(`@opentui/core: ${opentuiCoreDir}`);
console.log(`parser worker: ${parserWorker}`);

const binaries: Record<string, string> = {};

for (const item of targets) {
  // npm flags `win32` in package names; use `windows` instead.
  const osLabel = item.os === 'win32' ? 'windows' : item.os;
  const name = [
    '@llmops/cli',
    osLabel,
    item.arch,
    item.avx2 === false ? 'baseline' : undefined,
    item.abi,
  ]
    .filter(Boolean)
    .join('-')
    // npm package names can't contain '@' as a path separator inside a scope
    // segment, but `@llmops/cli-darwin-arm64` is valid. We just need a safe
    // dist directory name.
    .replace('@llmops/', '@llmops_');

  const distName = name; // safe dirname
  const pkgName = name.replace('@llmops_', '@llmops/');

  console.log(`\nbuilding ${pkgName}`);
  await $`mkdir -p dist/${distName}/bin`;

  const bunfsRoot = item.os === 'win32' ? 'B:/~BUN/root/' : '/$bunfs/root/';
  const workerRelativePath = path
    .relative(dir, parserWorker)
    .replaceAll('\\', '/');

  const target = `bun-${item.os}-${item.arch}${item.avx2 === false ? '-baseline' : ''}${item.abi ? `-${item.abi}` : ''}`;

  await Bun.build({
    conditions: ['browser'],
    tsconfig: './tsconfig.json',
    external: ['node-gyp'],
    compile: {
      target: target as Parameters<typeof Bun.build>[0]['compile']['target'],
      outfile: `dist/${distName}/bin/llmops`,
    },
    entrypoints: ['./src/index.ts', parserWorker],
    define: {
      OTUI_TREE_SITTER_WORKER_PATH: JSON.stringify(
        bunfsRoot + workerRelativePath,
      ),
    },
  });

  // Smoke test on the current platform only.
  if (
    item.os === process.platform &&
    item.arch === process.arch &&
    !item.abi &&
    item.avx2 !== false
  ) {
    const binaryPath = `dist/${distName}/bin/llmops`;
    console.log(`smoke test: ${binaryPath} --help`);
    try {
      await $`${binaryPath} --help`.quiet();
      console.log('smoke test passed');
    } catch (e) {
      console.error(`smoke test failed for ${pkgName}:`, e);
      process.exit(1);
    }
  }

  await Bun.file(`dist/${distName}/package.json`).write(
    JSON.stringify(
      {
        name: pkgName,
        version: pkg.version,
        os: [item.os],
        cpu: [item.arch],
      },
      null,
      2,
    ),
  );

  binaries[pkgName] = pkg.version;
}

console.log('\nbuilt binaries:', binaries);
export { binaries };
