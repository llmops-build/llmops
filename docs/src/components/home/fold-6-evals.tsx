import Fold from "./fold";

const FoldEvals = () => {
  return (
    <Fold
      number={6}
      title="Test & Evaluate"
      description="Built-in playgrounds and evaluation tools to iterate on your prompts."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-4">
            <p className="font-mono text-xs text-[var(--gray9)] mb-1">
              Playground
            </p>
            <p className="text-sm text-[var(--gray12)]">
              Test prompts interactively against any configured provider and
              model. Tweak variables, compare outputs, and iterate in real-time.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-4">
            <p className="font-mono text-xs text-[var(--gray9)] mb-1">
              Evaluations
            </p>
            <p className="text-sm text-[var(--gray12)]">
              Run structured evaluations across prompt variants. Track quality
              metrics and compare results to find the best configuration.
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--gray11)] leading-relaxed">
          Everything runs locally through your server. No data leaves your
          infrastructure unless you send it to an LLM provider.
        </p>
      </div>
    </Fold>
  );
};

export default FoldEvals;
