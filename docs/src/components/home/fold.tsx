interface FoldProps {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Fold = ({ number, title, description, children }: FoldProps) => {
  return (
    <section className="border-b border-[var(--gray4)] py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 md:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <span className="font-mono text-sm text-[var(--gray9)] block mb-2">
            {String(number).padStart(2, "0")}
          </span>
          <h2 className="text-2xl font-semibold text-[var(--gray12)] tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-[var(--gray11)] text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
};

export default Fold;
