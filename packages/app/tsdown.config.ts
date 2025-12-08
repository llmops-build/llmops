import { defineConfig } from 'tsdown';
import { readFileSync, existsSync } from 'fs';
import { resolve, join, dirname, basename } from 'path';

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
    treeshake: true,
    clean: false,
    plugins: [urlImportPlugin()],
  },
]);
