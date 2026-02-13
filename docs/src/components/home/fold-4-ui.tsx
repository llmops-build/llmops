'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const requests = [
  { time: '2026-02-12 21:46:39', model: 'moonshot/kimi-k2', endpoint: 'chat/completions', status: 200, tokens: '31 → 11', cost: '$0.0009', latency: '1220ms' },
  { time: '2026-02-12 21:46:27', model: 'google/gemini-2.5-flash', endpoint: 'chat/completions', status: 200, tokens: '18 → 10', cost: '$0.0008', latency: '3163ms' },
  { time: '2026-02-09 17:31:41', model: 'gpt-4.1-nano', endpoint: 'chat/completions', status: 200, tokens: '6 → 11', cost: '$0.0000', latency: '7760ms' },
  { time: '2026-02-09 13:00:16', model: 'claude-sonnet-4-5-20250929', endpoint: 'chat/completions', status: 200, tokens: '9 → 9', cost: '$0.0000', latency: '876ms' },
];

const FoldObserve = () => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const rows = el.querySelectorAll('[data-row]');
    gsap.set(rows, { opacity: 0, x: -12 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(rows, {
          opacity: 1,
          x: 0,
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.1,
        });
      },
      onLeaveBack: () => {
        gsap.to(rows, { opacity: 0, x: -12, duration: 0.2 });
      },
    });

    return () => trigger.kill();
  }, []);

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
        {/* Mobile */}
        <div className="px-4 pb-8 md:hidden">
          <div className="bg-gray-12 dark:bg-gray-2 rounded-lg border border-gray-11/10 dark:border-gray-4 overflow-hidden divide-y divide-gray-1/5 dark:divide-gray-3">
            {requests.map((r, i) => (
              <div key={i} className="px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400">{r.status}</span>
                  <span className="text-gray-1/70 dark:text-gray-11">{r.model}</span>
                  <span className="text-gray-1/40 dark:text-gray-9 ml-auto">{r.latency}</span>
                </div>
                <span className="text-gray-1/40 dark:text-gray-9 text-[10px]">{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: clean rows */}
        <div className="hidden md:block pb-8 px-10">
          <div
            ref={panelRef}
            className="bg-gray-12 dark:bg-gray-2 rounded-lg border border-gray-11/10 dark:border-gray-4 overflow-hidden divide-y divide-gray-1/8 dark:divide-gray-3"
          >
            {requests.map((r, i) => (
              <div key={i} data-row className="flex items-center gap-6 px-6 py-4 font-mono">
                <span className="text-sm text-gray-1/40 dark:text-gray-9 w-44 shrink-0">{r.time}</span>
                <span className="text-sm text-gray-1/80 dark:text-gray-12 flex-1">{r.model}</span>
                <span className="text-sm text-gray-1/50 dark:text-gray-10">{r.endpoint}</span>
                <span className={`text-sm px-2.5 py-0.5 rounded ${
                  r.status === 200
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {r.status}
                </span>
                <span className="text-sm text-gray-1/50 dark:text-gray-10 w-24 text-right">{r.tokens}</span>
                <span className="text-sm text-gray-1/60 dark:text-gray-11 w-20 text-right">{r.cost}</span>
                <span className="text-sm text-gray-1/40 dark:text-gray-9 w-20 text-right">{r.latency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoldObserve;
