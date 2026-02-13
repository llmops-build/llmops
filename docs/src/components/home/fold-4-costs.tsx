'use client';

const modelDistribution = [
  { model: 'gpt-4o', cost: '$0.042', percentage: 39, color: 'bg-accent-9' },
  { model: 'claude-sonnet', cost: '$0.031', percentage: 29, color: 'bg-accent-7' },
  { model: 'gemini-flash', cost: '$0.022', percentage: 21, color: 'bg-gray-8' },
  { model: 'kimi-k2', cost: '$0.012', percentage: 11, color: 'bg-gray-6' },
];

const CostHero = () => (
  <div className="bg-gray-2 rounded-lg border border-gray-4 p-8 shadow-sm">
    <span className="text-[10px] font-mono text-gray-9 uppercase tracking-widest block mb-3">
      Total Cost
    </span>
    <p className="text-5xl font-mono font-semibold text-gray-12 tracking-tight leading-none">
      $12.84
    </p>
    <div className="flex gap-8 mt-6 pt-6 border-t border-gray-4">
      <div>
        <span className="text-[10px] font-mono text-gray-9 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-9" />
          Input
        </span>
        <p className="text-lg font-mono font-semibold text-gray-12 mt-1">$8.21</p>
        <span className="text-[10px] font-mono text-gray-8">1.2M tokens</span>
      </div>
      <div>
        <span className="text-[10px] font-mono text-gray-9 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-8" />
          Output
        </span>
        <p className="text-lg font-mono font-semibold text-gray-12 mt-1">$4.63</p>
        <span className="text-[10px] font-mono text-gray-8">340K tokens</span>
      </div>
      <div>
        <span className="text-[10px] font-mono text-gray-9 uppercase tracking-wider">
          Requests
        </span>
        <p className="text-lg font-mono font-semibold text-gray-12 mt-1">847</p>
      </div>
    </div>
  </div>
);

const CostBreakdown = () => (
  <div className="bg-gray-2 rounded-lg border border-gray-4 p-8 shadow-sm">
    <span className="text-[10px] font-mono text-gray-9 uppercase tracking-widest block mb-4">
      Cost by Model
    </span>
    <div className="h-8 rounded-md overflow-hidden bg-gray-3 flex">
      {modelDistribution.map((m, i) => (
        <div
          key={m.model}
          className={`h-full ${m.color} ${i === 0 ? 'rounded-l-md' : ''} ${i === modelDistribution.length - 1 ? 'rounded-r-md' : ''}`}
          style={{ width: `${m.percentage}%`, transition: 'width 0.3s ease' }}
        />
      ))}
    </div>
    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
      {modelDistribution.map((m) => (
        <div key={m.model} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-9">
          <span className={`w-2 h-2 rounded-full ${m.color}`} />
          {m.model}: {m.cost} ({m.percentage}%)
        </div>
      ))}
    </div>
  </div>
);

const requests = [
  { time: '2026-02-12 21:46:39', model: 'moonshot/kimi-k2', endpoint: 'chat/completions', status: 200, tokens: '31 → 11', cost: '$0.0009', latency: '1220ms' },
  { time: '2026-02-12 21:46:27', model: 'google/gemini-2.5-flash', endpoint: 'chat/completions', status: 200, tokens: '18 → 10', cost: '$0.0008', latency: '3163ms' },
  { time: '2026-02-09 17:31:41', model: 'gpt-4.1-nano', endpoint: 'chat/completions', status: 200, tokens: '6 → 11', cost: '$0.0000', latency: '7760ms' },
  { time: '2026-02-09 13:00:16', model: 'claude-sonnet-4-5-20250929', endpoint: 'chat/completions', status: 200, tokens: '9 → 9', cost: '$0.0000', latency: '876ms' },
];

const RequestLogs = () => (
  <div className="bg-gray-2 rounded-lg border border-gray-4 overflow-hidden divide-y divide-gray-3">
    {requests.map((r, i) => (
      <div key={i} className="flex items-center gap-6 px-6 py-4 font-mono">
        <span className="text-sm text-gray-9 w-44 shrink-0">{r.time}</span>
        <span className="text-sm text-gray-12 flex-1">{r.model}</span>
        <span className="text-sm text-gray-10">{r.endpoint}</span>
        <span className="text-sm px-2.5 py-0.5 rounded bg-accent-3 text-accent-11">
          {r.status}
        </span>
        <span className="text-sm text-gray-10 w-24 text-right">{r.tokens}</span>
        <span className="text-sm text-gray-11 w-20 text-right">{r.cost}</span>
        <span className="text-sm text-gray-9 w-20 text-right">{r.latency}</span>
      </div>
    ))}
  </div>
);

const FoldCosts = () => {
  return (
    <section id="observability" className="border-b border-gray-4">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-9 block mb-2">
          {String(4).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-12 tracking-tight">
          See Everything
        </h2>
        <p className="mt-3 text-gray-11 text-sm leading-relaxed max-w-xl">
          Every request is logged automatically. Costs, latency, tokens — all tracked without extra code.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile: stacked */}
        <div className="flex flex-col gap-4 px-4 pb-8 md:hidden">
          <CostHero />
          <CostBreakdown />
          <div className="bg-gray-2 rounded-lg border border-gray-4 overflow-hidden divide-y divide-gray-3">
            {requests.map((r, i) => (
              <div key={i} className="px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-3 text-accent-11">{r.status}</span>
                  <span className="text-gray-11">{r.model}</span>
                  <span className="text-gray-9 ml-auto">{r.latency}</span>
                </div>
                <span className="text-gray-9 text-[10px]">{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: sticky stacking cards */}
        <div className="h-[250vh] relative hidden md:block px-10">
          {/* Bottom layer: Request logs — full width (stays longest) */}
          <div className="absolute top-0 w-[calc(100%-var(--spacing)*20)] h-[250vh] z-10">
            <div className="sticky top-72 h-[calc(100vh-var(--spacing)*80)]">
              <RequestLogs />
            </div>
          </div>

          {/* Middle layer: Cost breakdown bar — max-width, offset right */}
          <div className="absolute top-0 w-[calc(100%-var(--spacing)*20)] h-[160vh] z-20">
            <div className="sticky top-56 max-w-md ml-auto mr-8">
              <CostBreakdown />
            </div>
          </div>

          {/* Top layer: Cost hero — max-width, left-aligned (peels first) */}
          <div className="absolute top-0 w-[calc(100%-var(--spacing)*20)] h-[80vh] z-30">
            <div className="sticky top-28 max-w-sm ml-8">
              <CostHero />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoldCosts;
