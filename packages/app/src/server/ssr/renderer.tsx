import reactServer from 'react-dom/server';
import client from '@client/index?url';
import styles from '@client/styles/styles.css?url';
import { ReactRefresh } from './react-refresh';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import type { Manifest } from 'vite';

const { renderToString } = reactServer;
const thisDirecory = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(thisDirecory, './.vite/manifest.json');
const manifest: Manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
  : {};

export const renderer = ({
  basePath = '',
  dev = false,
  llmProviders,
}: {
  basePath?: string;
  dev?: boolean;
  llmProviders?: {
    key: string;
    name: string;
    imageURI: string;
  }[];
}) => {
  const stylesPath = basePath === '/' ? styles : basePath + styles;
  const clientPath = basePath === '/' ? client : basePath + client;

  const entryCSSFiles =
    Object.keys(manifest)
      ?.filter((key) => manifest[key].isEntry && manifest[key].css)
      ?.flatMap((key) => manifest[key].css || [])
      .map((cssFile) =>
        basePath === '/' ? `/${cssFile}` : basePath + `/${cssFile}`
      ) ||
    [].filter((cssFile) => {
      return cssFile !== stylesPath;
    });

  return renderToString(
    <html lang="en" className='dark'>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          /*! modern-normalize v3.0.1 | MIT License | https://github.com/sindresorhus/modern-normalize */

          /*
          Document
          ========
          */

          /**
          Use a better box model (opinionated).
          */

          *,
          ::before,
          ::after {
            box-sizing: border-box;
          }

          /**
          1. Improve consistency of default fonts in all browsers. (https://github.com/sindresorhus/modern-normalize/issues/3)
          2. Correct the line height in all browsers.
          3. Prevent adjustments of font size after orientation changes in iOS.
          4. Use a more readable tab size (opinionated).
          */

          html {
            font-family:
              system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
              'Apple Color Emoji', 'Segoe UI Emoji'; /* 1 */
            line-height: 1.15; /* 2 */
            -webkit-text-size-adjust: 100%; /* 3 */
            tab-size: 4; /* 4 */
          }

          /*
          Sections
          ========
          */

          /**
          Remove the margin in all browsers.
          */

          body {
            margin: 0;
          }

          /*
          Text-level semantics
          ====================
          */

          /**
          Add the correct font weight in Chrome and Safari.
          */

          b,
          strong {
            font-weight: bolder;
          }

          /**
          1. Improve consistency of default fonts in all browsers. (https://github.com/sindresorhus/modern-normalize/issues/3)
          2. Correct the odd 'em' font sizing in all browsers.
          */

          code,
          kbd,
          samp,
          pre {
            font-family:
              ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; /* 1 */
            font-size: 1em; /* 2 */
          }

          /**
          Add the correct font size in all browsers.
          */

          small {
            font-size: 80%;
          }

          /**
          Prevent 'sub' and 'sup' elements from affecting the line height in all browsers.
          */

          sub,
          sup {
            font-size: 75%;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
          }

          sub {
            bottom: -0.25em;
          }

          sup {
            top: -0.5em;
          }

          /*
          Tabular data
          ============
          */

          /**
          Correct table border color inheritance in Chrome and Safari. (https://issues.chromium.org/issues/40615503, https://bugs.webkit.org/show_bug.cgi?id=195016)
          */

          table {
            border-color: currentcolor;
          }

          /*
          Forms
          =====
          */

          /**
          1. Change the font styles in all browsers.
          2. Remove the margin in Firefox and Safari.
          */

          button,
          input,
          optgroup,
          select,
          textarea {
            font-family: inherit; /* 1 */
            font-size: 100%; /* 1 */
            line-height: 1.15; /* 1 */
            margin: 0; /* 2 */
          }

          /**
          Correct the inability to style clickable types in iOS and Safari.
          */

          button,
          [type='button'],
          [type='reset'],
          [type='submit'] {
            -webkit-appearance: button;
          }

          /**
          Remove the padding so developers are not caught out when they zero out 'fieldset' elements in all browsers.
          */

          legend {
            padding: 0;
          }

          /**
          Add the correct vertical alignment in Chrome and Firefox.
          */

          progress {
            vertical-align: baseline;
          }

          /**
          Correct the cursor style of increment and decrement buttons in Safari.
          */

          ::-webkit-inner-spin-button,
          ::-webkit-outer-spin-button {
            height: auto;
          }

          /**
          1. Correct the odd appearance in Chrome and Safari.
          2. Correct the outline style in Safari.
          */

          [type='search'] {
            -webkit-appearance: textfield; /* 1 */
            outline-offset: -2px; /* 2 */
          }

          /**
          Remove the inner padding in Chrome and Safari on macOS.
          */

          ::-webkit-search-decoration {
            -webkit-appearance: none;
          }

          /**
          1. Correct the inability to style clickable types in iOS and Safari.
          2. Change font properties to 'inherit' in Safari.
          */

          ::-webkit-file-upload-button {
            -webkit-appearance: button; /* 1 */
            font: inherit; /* 2 */
          }

          /*
          Interactive
          ===========
          */

          /*
          Add the correct display in Chrome and Safari.
          */

          summary {
            display: list-item;
          }

          .root {
            isolation: isolate;
          }

        `}</style>
        <link href={stylesPath} rel="stylesheet" />
        {entryCSSFiles.map((cssFile) => (
          <link key={cssFile} href={cssFile} rel="stylesheet" />
        ))}
        <script>
          {`
            window.bootstrapData = {
              basePath: "${basePath}",
              llmProviders: ${JSON.stringify(llmProviders || [])}
            };
          `}
        </script>
        <ReactRefresh />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root" className="root" />
        <script type="module" src={clientPath}></script>
      </body>
    </html>
  );
};
