'use client';

interface WindowChromeProps {
  tabs?: { name: string; active?: boolean; onClick?: () => void }[];
  children: React.ReactNode;
}

const WindowChrome = ({ tabs, children }: WindowChromeProps) => {
  return (
    <div className="rounded-lg border border-gray-4 bg-gray-2 overflow-hidden shadow-md">
      {tabs && (
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-4 bg-gray-1">
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
      {children}
    </div>
  );
};

export default WindowChrome;
