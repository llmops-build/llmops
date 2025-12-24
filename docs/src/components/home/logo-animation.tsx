// @ts-expect-error // svgr import
import Logo from '@/assets/llmops.svg?react';

const LogoAnimation = () => {
  return (
    <div className="w-60 aspect-square flex items-center justify-center relative">
      <div className="bg-gray-12 w-16 h-16 rounded-full flex">
        <Logo className="w-16 h-16 invert dark:invert-0 relative z-10" />
      </div>
      <div className="absolute inset-0 z-0">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <div
              key={`circ-${index}`}
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
