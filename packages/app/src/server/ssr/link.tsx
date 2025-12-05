/**
 * @reference https://github.com/honojs/honox/blob/53a756cf3272cfdd4332097f8358ff63950b52a6/src/server/components/link.tsx
 */
import { ensureTrailngSlash } from '@server/lib/path';
import type { JSX, FC } from 'react';
import type { Manifest } from 'vite';

type Options = {
  manifest?: Manifest;
  prod?: boolean;
  baseUrl?: string;
} & JSX.IntrinsicElements['link'];

export const Link: FC<Options> = (options) => {
  let { href, baseUrl, manifest, ...rest } = options;
  if (href) {
    const resolvedBaseUrl = baseUrl ?? '/';

    if (!manifest) {
      const MANIFEST = import.meta.glob<{ default: Manifest }>(
        './.vite/manifest.json',
        {
          eager: true,
        }
      );
      for (const [, manifestFile] of Object.entries(MANIFEST)) {
        if (manifestFile['default']) {
          manifest = manifestFile['default'];
          break;
        }
      }
    }

    if (manifest) {
      const assetInManifest = manifest[href.replace(/^\//, '')];
      if (assetInManifest) {
        if (href.startsWith('/')) {
          return (
            <link
              href={`${ensureTrailngSlash(resolvedBaseUrl)}${assetInManifest.file}`}
              {...rest}
            ></link>
          );
        }
        return <link href={assetInManifest.file} {...rest}></link>;
      }
    }

    return <link href={href} {...rest}></link>;
  }

  return <link {...rest} />;
};
