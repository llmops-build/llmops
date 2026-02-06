import CodeBlock from "./code-block";
import Fold from "./fold";

const installCode = `npm install @llmops/sdk pg`;

const clientCode = `import { llmops } from '@llmops/sdk';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',
  database: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
});`;

const serverCode = `import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';
import client from './llmops';

const app = express();
app.use('/llmops', createLLMOpsMiddleware(client));
app.listen(3000);`;

const FoldInstall = () => {
  return (
    <Fold
      number={1}
      title="Install & Connect"
      description="One package. One database connection. That's the entire setup."
    >
      <div className="flex flex-col gap-4">
        <CodeBlock code={installCode} language="bash" />
        <CodeBlock
          code={clientCode}
          language="typescript"
          filename="llmops.ts"
        />
        <CodeBlock
          code={serverCode}
          language="typescript"
          filename="server.ts"
        />
      </div>
    </Fold>
  );
};

export default FoldInstall;
