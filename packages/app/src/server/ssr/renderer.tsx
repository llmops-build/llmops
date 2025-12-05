import reactServer from 'react-dom/server';
import client from '@client/index?url';
import styles from '@client/styles/global.css?url';
import { ReactRefresh } from './react-refresh';

const { renderToString } = reactServer;

export const renderer = ({ basePath = '' }) => {
  const stylesPath = basePath + styles;
  const clientPath = basePath + client;

  return renderToString(
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href={stylesPath} rel="stylesheet" />
        <ReactRefresh />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root" className="h-[calc(100vh-(var(--version-height)))]" />
        <script type="module" src={clientPath}></script>
      </body>
    </html>
  );
};
