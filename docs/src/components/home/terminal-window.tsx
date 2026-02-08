'use client';

import { useEffect, useState } from 'react';

interface TerminalWindowProps {
  command: string;
}

const TerminalWindow = ({ command }: TerminalWindowProps) => {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (displayedChars < command.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
    setDone(true);
  }, [displayedChars, command.length]);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative cursor-pointer"
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setCopied(false);
      }}
    >
      {hovered && (
        <div className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded bg-gray-12 text-gray-1 text-xs font-mono whitespace-nowrap border border-gray-10">
          {copied ? 'Copied!' : 'Click to copy'}
        </div>
      )}
      <div className="rounded-lg border border-gray-10 bg-gray-12 overflow-hidden">
        <div className="p-4 font-mono text-sm text-gray-1">
          <span className="select-none text-gray-5">$ </span>
          <span>{command.slice(0, displayedChars)}</span>
          <span
            className={`inline-block w-[2px] h-[1em] bg-gray-1 align-text-bottom ml-px ${
              done ? 'animate-blink' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default TerminalWindow;
