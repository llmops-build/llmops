'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const PROMPT = 'What model are you?';
const RESPONSE = 'I am a large language model, trained by Google.';

const BrowserWindow = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [started, setStarted] = useState(false);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      onEnter: () => {
        setStarted(true);
        setStreaming(true);
      },
      onLeaveBack: () => {
        setStarted(false);
        setStreaming(false);
        setDisplayedChars(0);
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!started) return;

    if (displayedChars < RESPONSE.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }

    setStreaming(false);
  }, [started, displayedChars]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-gray-4 bg-gray-1 overflow-hidden shadow-md"
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-4 bg-gray-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-6" />
        </div>
        <div className="flex-1 bg-gray-3 rounded px-3 py-1 text-xs font-mono text-gray-9">
          http://localhost:3001
        </div>
      </div>
      <div className="p-3 md:p-4 font-mono text-xs md:text-sm text-gray-12 leading-relaxed">
        <p>
          <span className="font-semibold">Prompt:</span> {PROMPT}
        </p>
        <p className="mt-2">
          {RESPONSE.slice(0, displayedChars)}
          <span
            className={`inline-block w-[2px] h-[1em] bg-gray-12 align-text-bottom ml-px ${
              streaming ? 'animate-blink' : 'opacity-0'
            }`}
          />
        </p>
      </div>
    </div>
  );
};

export default BrowserWindow;
