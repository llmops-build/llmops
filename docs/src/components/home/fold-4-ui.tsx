import Fold from "./fold";

const FoldUI = () => {
  return (
    <Fold
      number={4}
      title="Explore Visually"
      description="A built-in dashboard ships with the SDK. No separate install."
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-6">
          <p className="font-mono text-sm text-[var(--gray12)]">
            Visit{" "}
            <code className="bg-[var(--gray3)] px-1.5 py-0.5 rounded">
              http://localhost:3000/llmops
            </code>{" "}
            in your browser.
          </p>
        </div>
        <p className="text-sm text-[var(--gray11)] leading-relaxed">
          The UI is served directly from your Express or Hono server. Browse
          requests, inspect traces, manage providers, and configure prompts —
          all from a single interface.
        </p>
      </div>
    </Fold>
  );
};

export default FoldUI;
