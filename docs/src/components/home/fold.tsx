interface FoldProps {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Fold = ({ number, title, description, children }: FoldProps) => {
  return (
    <section className="border-b border-[var(--gray4)]">
      <div className="mb-8 py-8 md:py-12 px-10">
        <span className="font-mono text-sm text-[var(--gray9)] block mb-2">
          {String(number).padStart(2, '0')}
        </span>
        <h2 className="text-3xl font-pixel font-semibold text-[var(--gray12)] tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-[var(--gray11)] text-sm leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
};

export default Fold;
