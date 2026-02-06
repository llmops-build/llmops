import CodeBlock from "./code-block";
import Fold from "./fold";

const promptCode = `fetch('/llmops/api/genai/v1/chat/completions', {
  headers: {
    'x-llmops-config': 'my-chatbot-prompt',
    'Authorization': \`Bearer \${envSecret}\`,
  },
  body: JSON.stringify({
    model: '@openai/gpt-4o',
    variables: { userName: 'Alice' }
  })
});`;

const FoldPrompts = () => {
  return (
    <Fold
      number={5}
      title="Version Your Prompts"
      description="Manage prompts from the UI and reference them by name in your API calls."
    >
      <div className="flex flex-col gap-4">
        <CodeBlock code={promptCode} language="typescript" />
        <p className="text-sm text-[var(--gray11)] leading-relaxed">
          The{" "}
          <code className="font-mono text-xs bg-[var(--gray3)] px-1.5 py-0.5 rounded">
            x-llmops-config
          </code>{" "}
          header links a request to a prompt configuration. Update prompts
          without redeploying your application.
        </p>
      </div>
    </Fold>
  );
};

export default FoldPrompts;
