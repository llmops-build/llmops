#!/usr/bin/env bun
/**
 * Publish script for @llmops/cli.
 *
 * Reads the per-platform packages built into dist/ by script/build.ts,
 * assembles the meta package (the thing users `npm install`), and—
 * unless invoked with --dry—publishes everything to npm.
 *
 * The meta package is a tiny ~150-line Node shim plus a `optionalDependencies`
 * map of every platform package. npm uses each platform package's `os`/`cpu`
 * fields to skip the ones that don't match the user's machine, so users
 * download exactly one binary.
 *
 * Modeled on opencode's packages/opencode/script/publish.ts but stops
 * short of CI-only steps (Docker push, Homebrew tap update, AUR PKGBUILD).
 */
import { $ } from 'bun';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(dir);

const dryRun = process.argv.includes('--dry');
const tag = (() => {
  const i = process.argv.indexOf('--tag');
  return i !== -1 ? process.argv[i + 1] : 'latest';
})();

const sourcePkg = await Bun.file(path.join(dir, 'package.json')).json();
const version = sourcePkg.version;
const metaName = '@llmops/cli';

// Discover every per-platform package the build emitted into dist/.
// Each lives at dist/<safe-dir>/package.json with the real scoped name inside.
const optionalDeps: Record<string, string> = {};
for await (const entry of new Bun.Glob('*/package.json').scan({
  cwd: 'dist',
})) {
  const pkgJson = await Bun.file(`./dist/${entry}`).json();
  optionalDeps[pkgJson.name] = pkgJson.version;
}

if (Object.keys(optionalDeps).length === 0) {
  console.error(
    'No per-platform packages found in ./dist. Run `bun run build` first.',
  );
  process.exit(1);
}

console.log('per-platform packages:', optionalDeps);

// Assemble the meta package in dist/@llmops_cli (safe dirname; the
// real package.json `name` is @llmops/cli).
const metaDir = 'dist/@llmops_cli';
await $`rm -rf ${metaDir}`;
await $`mkdir -p ${metaDir}/bin`;
await $`cp ./bin/llmops ${metaDir}/bin/llmops`;
await $`chmod +x ${metaDir}/bin/llmops`;

await Bun.file(`${metaDir}/package.json`).write(
  JSON.stringify(
    {
      name: metaName,
      version,
      // The Node shim in bin/llmops uses ESM (import.meta.url, etc),
      // so the meta package must declare type: module too.
      type: 'module',
      description: sourcePkg.description,
      license: sourcePkg.license,
      homepage: sourcePkg.homepage,
      bugs: sourcePkg.bugs,
      repository: sourcePkg.repository,
      author: sourcePkg.author,
      keywords: sourcePkg.keywords,
      bin: {
        llmops: './bin/llmops',
      },
      optionalDependencies: optionalDeps,
    },
    null,
    2,
  ),
);

// Copy the LICENSE if present at the repo root.
const repoRootLicense = path.resolve(dir, '../../LICENSE');
if (await Bun.file(repoRootLicense).exists()) {
  await $`cp ${repoRootLicense} ${metaDir}/LICENSE`;
}

console.log(`assembled meta package at ${metaDir}`);

if (dryRun) {
  console.log('--dry: skipping npm publish. Packing for inspection instead.');
  // Pack each per-platform package + meta so we can install them locally.
  for (const safeDir of Object.keys(optionalDeps)
    .map((n) => `dist/${n.replace('@llmops/', '@llmops_')}`)
    .concat([metaDir])) {
    await $`cd ${safeDir} && npm pack`.nothrow();
  }
  console.log('packed .tgz files into each dist/ subdir');
  process.exit(0);
}

// Real publish path.
const tasks = Object.keys(optionalDeps).map(async (name) => {
  const safeDir = `dist/${name.replace('@llmops/', '@llmops_')}`;
  await $`chmod -R 755 .`.cwd(safeDir).nothrow();
  await $`npm publish --access public --tag ${tag}`.cwd(safeDir);
});
await Promise.all(tasks);

await $`npm publish --access public --tag ${tag}`.cwd(metaDir);
console.log(`published ${metaName}@${version} (tag: ${tag})`);
