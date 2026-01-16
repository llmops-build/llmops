import { defineConfig } from 'tsdown';
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import { resolve, join, basename, extname } from 'path';

// MIME type mapping for common file extensions
const mimeTypes: Record<string, string> = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain',
  '.map': 'application/json',
};

// Helper to get MIME type from file path
const getMimeType = (filePath: string): string => {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
};

// Helper to recursively get all files in a directory
const getAllFiles = (
  dirPath: string,
  arrayOfFiles: string[] = []
): string[] => {
  if (!existsSync(dirPath)) return arrayOfFiles;

  const files = readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

// Plugin to embed all assets into the bundle
const embedAssetsPlugin = () => {
  const VIRTUAL_MODULE_ID = 'virtual:embedded-assets';
  const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

  return {
    name: 'embed-assets',
    buildStart() {
      const distPath = resolve('./dist');
      const assetsPath = join(distPath, 'assets');
      const manifestPath = join(distPath, '.vite', 'manifest.json');

      // Generate embedded assets module
      const assets: Record<string, { content: string; mimeType: string }> = {};

      // Read all asset files
      const assetFiles = getAllFiles(assetsPath);
      for (const filePath of assetFiles) {
        const relativePath =
          '/assets/' + filePath.replace(assetsPath + '/', '');
        const content = readFileSync(filePath);
        const base64 = content.toString('base64');
        const mimeType = getMimeType(filePath);
        assets[relativePath] = { content: base64, mimeType };
      }

      // Read manifest if it exists
      let manifest = {};
      if (existsSync(manifestPath)) {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      }

      // Generate the TypeScript source for embedded assets
      const embeddedAssetsSource = `
// Auto-generated embedded assets module
// This file is generated during build and should not be edited manually

export interface EmbeddedAsset {
  content: string; // base64 encoded
  mimeType: string;
}

export const embeddedAssets: Record<string, EmbeddedAsset> = ${JSON.stringify(assets, null, 2)};

export const manifest = ${JSON.stringify(manifest, null, 2)};

export const getAsset = (path: string): EmbeddedAsset | undefined => {
  return embeddedAssets[path];
};

export const decodeAsset = (asset: EmbeddedAsset): Buffer => {
  return Buffer.from(asset.content, 'base64');
};
`;

      // Write the generated module to a file that can be imported
      const generatedPath = resolve('./src/server/generated');
      if (!existsSync(generatedPath)) {
        require('fs').mkdirSync(generatedPath, { recursive: true });
      }
      writeFileSync(
        join(generatedPath, 'embedded-assets.ts'),
        embeddedAssetsSource
      );

      console.log(
        `[embed-assets] Embedded ${Object.keys(assets).length} assets`
      );
    },
    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
    load(id: string) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export * from './src/server/generated/embedded-assets';`;
      }
    },
  };
};

// Custom plugin to handle ?url imports like Vite
const urlImportPlugin = () => {
  let viteManifest: any = null;

  return {
    name: 'url-import',
    buildStart() {
      // Try to load Vite manifest
      const manifestPath = resolve('./dist/.vite/manifest.json');
      if (existsSync(manifestPath)) {
        try {
          const manifestContent = readFileSync(manifestPath, 'utf-8');
          viteManifest = JSON.parse(manifestContent);
        } catch (error) {
          console.warn('Failed to load Vite manifest:', error);
        }
      }
    },
    resolveId(id: string, importer: string) {
      if (id.includes('?url')) {
        const cleanId = id.replace('?url', '');
        return this.resolve(cleanId, importer, { skipSelf: true }).then(
          (resolved) => {
            if (resolved) {
              return resolved.id + '?url';
            }
            return null;
          }
        );
      }
    },
    load(id: string) {
      if (id.includes('?url')) {
        const cleanId = id.replace('?url', '');
        let filePath = cleanId;

        // Handle @client alias
        if (cleanId.startsWith('@client/')) {
          filePath = cleanId.replace('@client/', './src/client/');
        }

        // Check if this file exists in Vite manifest
        if (viteManifest) {
          // Convert the path to match manifest keys
          let manifestKey;

          // If it's an absolute path, extract the relative part
          if (cleanId.includes('/src/client/')) {
            // Extract everything from 'src/client/' onwards
            const srcIndex = cleanId.indexOf('src/client/');
            manifestKey = cleanId.substring(srcIndex);
          } else if (cleanId.startsWith('@client/')) {
            // Handle @client alias
            manifestKey = cleanId.replace('@client/', 'src/client/');
          } else {
            manifestKey = cleanId;
          }

          const manifestEntry = viteManifest[manifestKey];
          if (manifestEntry && manifestEntry.file) {
            // Return the URL to the Vite-built file
            return `export default "/${manifestEntry.file}";`;
          }
        }

        // Fallback to original behavior for non-manifest files
        try {
          const absolutePath = resolve(filePath);
          let fileName = basename(absolutePath);
          const source = readFileSync(absolutePath, 'utf-8');

          // Change .ts extension to .js for the emitted file
          if (fileName.endsWith('.ts')) {
            fileName = fileName.replace(/\.ts$/, '.js');
          }

          // Emit the file and return the URL
          const referenceId = this.emitFile({
            type: 'asset',
            name: fileName,
            source,
          });

          return `export default new URL(import.meta.ROLLUP_FILE_URL_${referenceId}, import.meta.url).href;`;
        } catch (error) {
          this.error(`Failed to load asset: ${cleanId}. Error: ${error}`);
        }
      }
    },
  };
};

export default defineConfig([
  {
    entry: './src/index.ts',
    format: ['esm', 'cjs'],
    dts: true,
    treeshake: true,
    clean: false,
    plugins: [embedAssetsPlugin(), urlImportPlugin()],
  },
  {
    // Edge-compatible build (no static assets, no SSR)
    entry: './src/edge.ts',
    format: ['esm', 'cjs'],
    dts: true,
    treeshake: true,
    clean: false,
  },
]);
