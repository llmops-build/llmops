/**
 * @reference https://github.com/honojs/honox/blob/e66a876e411f4b01362e7588e6ee29ca39b41152/src/server/components/script.tsx
 */
import { readFileSync } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Manifest } from 'vite';

type Options = {
  src: string;
  async?: boolean;
  prod?: boolean;
  manifest?: Manifest;
  nonce?: string;
  basePath?: string;
};

let manifest: Manifest | null = null;

try {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const manifestPath = path.join(thisDir, '/.vite/manifest.json');
  const manifestStr = readFileSync(manifestPath).toString();
  manifest = JSON.parse(manifestStr) as Manifest;
} catch (e) {
  console.log(e);
  console.log('No manifest found for scripts.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Script = (options: Options): any => {
  const src = options.src;
  console.log(dirname(fileURLToPath(import.meta.url)));

  if (manifest) {
    const scriptInManifest = manifest[src.replace(/^\//, '')];
    if (scriptInManifest) {
      return (
        <script
          type="module"
          async={!!options.async}
          src={`/${scriptInManifest.file}`}
          nonce={options.nonce}
        ></script>
      );
    }
  }

  return (
    <script
      type="module"
      async={!!options.async}
      src={src}
      nonce={options.nonce}
    ></script>
  );
};
