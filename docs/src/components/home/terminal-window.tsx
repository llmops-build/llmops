'use client';

import { useEffect, useState } from 'react';
import WindowChrome from './window-chrome';

interface TerminalWindowProps {
  command: string;
}

const TerminalWindow = ({ command }: TerminalWindowProps) => {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (displayedChars < command.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
    setDone(true);
  }, [displayedChars, command.length]);

  return (
    <WindowChrome title="Terminal">
      <div className="p-4 font-mono text-sm text-gray-12">
        <span className="text-gray-9">$ </span>
        <span>{command.slice(0, displayedChars)}</span>
        <span
          className={`inline-block w-[2px] h-[1em] bg-gray-12 align-text-bottom ml-px ${
            done ? 'animate-blink' : ''
          }`}
        />
      </div>
    </WindowChrome>
  );
};

export default TerminalWindow;
