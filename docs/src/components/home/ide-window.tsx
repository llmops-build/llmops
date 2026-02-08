'use client';

import { useState } from 'react';
import WindowChrome from './window-chrome';

interface IDETab {
  name: string;
  content: React.ReactNode;
}

interface IDEWindowProps {
  tabs: IDETab[];
}

const IDEWindow = ({ tabs }: IDEWindowProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const chromeTabs = tabs.map((tab, i) => ({
    name: tab.name,
    active: i === activeIndex,
    onClick: () => setActiveIndex(i),
  }));

  return (
    <WindowChrome tabs={chromeTabs}>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-gray-12">
        {tabs[activeIndex].content}
      </pre>
    </WindowChrome>
  );
};

export default IDEWindow;
