'use client';

const FoldObserve = () => {
  return (
    <section className="border-b border-gray-4">
      <div className="mb-8 py-8 md:py-12 px-6 md:px-10">
        <span className="font-mono text-sm text-gray-9 block mb-2">
          {String(4).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-gray-12 tracking-tight">
          See Everything
        </h2>
        <p className="mt-3 text-gray-11 text-sm leading-relaxed max-w-xl">
          Observability is automatic. No extra code required.
        </p>
      </div>
      <div className="min-w-0">
        {/* Mobile */}
        <div className="flex flex-col gap-4 px-4 pb-8 md:hidden">
          {/* Screenshot placeholder — 16:9 */}
          <div className="rounded-lg border border-gray-4 bg-gray-2 overflow-hidden aspect-video">
            <img
              src="/screenshots/observe.png"
              alt="Observability dashboard"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm text-gray-11/80 leading-relaxed text-center">
            Every call through the gateway is logged. Zero setup.
          </p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block pb-8 px-10">
          {/* Screenshot placeholder — 16:9 */}
          <div className="rounded-lg border border-gray-4 bg-gray-2 overflow-hidden aspect-video max-w-3xl mx-auto">
            <img
              src="/screenshots/observe.png"
              alt="Observability dashboard"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm text-gray-11/80 leading-relaxed text-center py-8 px-6">
            Every call through the gateway is logged. Zero setup.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FoldObserve;
