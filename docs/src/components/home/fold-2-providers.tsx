import CodeBlock from "./code-block";
import Fold from "./fold";

const curlCode = `curl http://localhost:3000/llmops/api/genai/v1/chat/completions \\
  -H "Authorization: Bearer $ENV_SECRET" \\
  -d '{
    "model": "@openai-prod/gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`;

const FoldProviders = () => {
  return (
    <Fold
      number={2}
      title="Add Providers"
      description="Register multiple LLM providers with custom slugs. Route requests to any model through a unified API."
    >
      <div className="flex flex-col gap-4">
        <CodeBlock code={curlCode} language="bash" />
        <p className="text-sm text-[var(--gray11)] leading-relaxed">
          Use provider slugs like{" "}
          <code className="font-mono text-xs bg-[var(--gray3)] px-1.5 py-0.5 rounded">
            @openai-prod/gpt-4o
          </code>{" "}
          to route requests. Each provider gets its own credentials and
          configuration.
        </p>
      </div>
    </Fold>
  );
};

export default FoldProviders;
