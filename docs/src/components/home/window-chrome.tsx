'use client';

interface WindowChromeProps {
  title?: string;
  tabs?: { name: string; active?: boolean; onClick?: () => void }[];
  children: React.ReactNode;
}

const WindowChrome = ({ title, tabs, children }: WindowChromeProps) => {
  return (
    <div className="rounded-lg border border-gray-4 bg-gray-2 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-4 bg-gray-1">
        <div className="flex items-center gap-1.5 mr-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        {title && !tabs && (
          <span className="font-mono text-xs text-gray-9">{title}</span>
        )}
        {tabs && (
          <div className="flex items-center gap-0.5">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.name}
                onClick={tab.onClick}
                className={`px-3 py-1 rounded font-mono text-xs transition-colors cursor-pointer ${
                  tab.active
                    ? 'text-gray-12 bg-gray-3'
                    : 'text-gray-9 hover:text-gray-11'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default WindowChrome;
