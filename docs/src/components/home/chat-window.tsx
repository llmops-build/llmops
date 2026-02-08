'use client';

import { useEffect, useState } from 'react';
import WindowChrome from './window-chrome';

const USER_MESSAGE = 'What is LLMOps?';
const AI_RESPONSE =
  'LLMOps is the set of practices, tools, and infrastructure used to operationalize large language models in production. It covers prompt management, observability, evaluation, cost tracking, and provider orchestration — giving engineering teams full control over their AI stack.';

const ChatWindow = () => {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [streaming, setStreaming] = useState(true);

  useEffect(() => {
    if (displayedChars < AI_RESPONSE.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }

    setStreaming(false);
    const resetTimeout = setTimeout(() => {
      setDisplayedChars(0);
      setStreaming(true);
    }, 4000);
    return () => clearTimeout(resetTimeout);
  }, [displayedChars]);

  return (
    <WindowChrome title="Claude 3.5 Sonnet">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex justify-end">
          <div className="bg-accent-3 text-gray-12 text-sm rounded-lg px-3 py-2 max-w-[80%]">
            {USER_MESSAGE}
          </div>
        </div>
        <div className="flex justify-start">
          <div className="text-gray-11 text-sm rounded-lg max-w-[90%] leading-relaxed">
            {AI_RESPONSE.slice(0, displayedChars)}
            <span
              className={`inline-block w-[2px] h-[1em] bg-gray-12 align-text-bottom ml-px ${
                streaming ? 'animate-blink' : 'opacity-0'
              }`}
            />
          </div>
        </div>
      </div>
    </WindowChrome>
  );
};

export default ChatWindow;
