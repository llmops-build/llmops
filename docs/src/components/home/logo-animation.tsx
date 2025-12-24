// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';

const circleKeys = ['circ-1', 'circ-2', 'circ-3', 'circ-4'];

const LogoAnimation = () => {
  return (
    <div className="w-60 aspect-square flex items-center justify-center relative">
      <svg
        viewBox="0 0 400 400"
        className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 animate-[spin_20s_linear_infinite]"
        aria-hidden="true"
      >
        <defs>
          <path
            id="MyPath"
            d="M 200, 200 m -180, 0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0"
          />
        </defs>
        <text
          fontFamily="Geist Mono, monospace"
          fontSize="21"
          fill="var(--color-gray-9)"
        >
          <textPath href="#MyPath">
            LLMOps • LLMOps • LLMOps • LLMOps • LLMOps • LLMOps • LLMOps •
            LLMOps • LLMOps • LLMOps • LLMOps •
          </textPath>
        </text>
      </svg>
      <div className="bg-gray-12 w-16 h-16 rounded-full flex overflow-hidden shadow-glow">
        <Logo className="w-16 h-16 invert dark:invert-0 relative z-10" />
      </div>
      <div className="absolute inset-0 z-0">
        {circleKeys.map((key, index) => (
          <div
            key={key}
            className="border-gray-12 absolute inset-0 border rounded-full opacity-0 animate-[fade-out-scale_2s_ease-out_infinite]"
            style={{
              animationDelay: `${index * 0.5}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LogoAnimation;
