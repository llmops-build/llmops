import client from '@client/index?url';
import styles from '@client/styles/styles.css?url';
import type { Manifest } from 'vite';
import { manifest as embeddedManifest } from '../generated/embedded-assets';

// Use embedded manifest in production. In dev mode, Vite handles asset serving
// so the manifest isn't needed — the ?url imports provide the correct paths.
const manifest: Manifest =
  Object.keys(embeddedManifest).length > 0
    ? (embeddedManifest as unknown as Manifest)
    : {};

export interface RendererOptions {
  basePath?: string;
  dev?: boolean;
}

export const renderer = ({
  basePath = '',
  dev = false,
}: RendererOptions): string => {
  const stylesPath = basePath === '/' ? styles : basePath + styles;
  const clientPath = basePath === '/' ? client : basePath + client;
  const faviconIcoPath =
    basePath === '/' ? '/favicon.ico' : basePath + '/favicon.ico';
  const faviconSvgPath =
    basePath === '/'
      ? (!dev ? '/assets' : '') + '/favicon.svg'
      : basePath + (!dev ? '/assets' : '') + '/favicon.svg';

  const entryCSSFiles =
    Object.keys(manifest)
      ?.filter((key) => manifest[key].isEntry && manifest[key].css)
      ?.flatMap((key) => manifest[key].css || [])
      .map((cssFile) =>
        basePath === '/' ? `/${cssFile}` : basePath + `/${cssFile}`,
      )
      .filter((cssFile) => cssFile !== stylesPath) || [];

  const cssLinks = entryCSSFiles
    .map((cssFile) => `<link href="${cssFile}" rel="stylesheet" />`)
    .join('\n    ');

  const refreshScript = dev
    ? `<script type="module">
      import RefreshRuntime from "/@react-refresh";
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap" rel="stylesheet" />
    <link rel="icon" href="${faviconIcoPath}" sizes="any" />
    <link rel="icon" href="${faviconSvgPath}" type="image/svg+xml" />
    <style>
*,::before,::after{box-sizing:border-box}html{font-family:system-ui,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji';line-height:1.15;-webkit-text-size-adjust:100%;tab-size:4}body{margin:0}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}table{border-color:currentcolor}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,[type='button'],[type='reset'],[type='submit']{-webkit-appearance:button}legend{padding:0}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type='search']{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}.root{isolation:isolate}
    </style>
    <link href="${stylesPath}" rel="stylesheet" />
    ${cssLinks}
    <script>
      window.bootstrapData = {
        basePath: "${basePath}"
      };
    </script>
    ${refreshScript}
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root" class="root"></div>
    <script type="module" src="${clientPath}"></script>
  </body>
</html>`;
};
