import CodeBlock from "./code-block";
import Fold from "./fold";

const installCode = `npm i @llmops/sdk`;

const envCode = `OPENAI_API_KEY=sk-...`;

const clientCode = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000/llmops/api/genai/v1',
});

export default openai;`;

const serverCode = `import { Hono } from 'hono';
import { createLLMOpsMiddleware } from '@llmops/sdk/hono';
import { llmops } from '@llmops/sdk';

const app = new Hono();

app.use('/llmops/*', createLLMOpsMiddleware(
  llmops({ basePath: '/llmops' })
));

export default app;`;

const FoldInstall = () => {
  return (
    <Fold
      number={1}
      title="Install & Connect"
      description="One package. One database connection. That's the entire setup."
    >
      <div className="flex flex-col gap-4">
        <CodeBlock code={installCode} language="bash" />
        <CodeBlock code={envCode} language="bash" filename=".env" />
        <CodeBlock
          code={clientCode}
          language="typescript"
          filename="client.ts"
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
