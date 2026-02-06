import Fold from "./fold";

const FoldObserve = () => {
  return (
    <Fold
      number={3}
      title="See Everything"
      description="Observability is automatic. No extra code required."
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-[var(--gray11)] leading-relaxed">
          Already configured. Your database stores every request, token count,
          and latency metric. Every call through the gateway is logged
          automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-4">
            <p className="font-mono text-xs text-[var(--gray9)] mb-1">
              Requests
            </p>
            <p className="text-sm text-[var(--gray12)]">
              Full request/response logging
            </p>
          </div>
          <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-4">
            <p className="font-mono text-xs text-[var(--gray9)] mb-1">Tokens</p>
            <p className="text-sm text-[var(--gray12)]">
              Input, output, and total counts
            </p>
          </div>
          <div className="rounded-lg border border-[var(--gray4)] bg-[var(--gray2)] p-4">
            <p className="font-mono text-xs text-[var(--gray9)] mb-1">
              Latency
            </p>
            <p className="text-sm text-[var(--gray12)]">
              End-to-end timing per request
            </p>
          </div>
        </div>
      </div>
    </Fold>
  );
};

export default FoldObserve;
