'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

const LLM = () => {
  return (
    <div className="inline [text-shadow:1px_1px_0_#D97757,2px_2px_0_#D97757,3px_3px_0_#4285F4,4px_4px_0_#4285F4]">
      LLM
    </div>
  );
};

const Infrastructure = () => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const animate = () => {
      const visibleSpans = container.querySelectorAll('.text-visible span');
      const hiddenSpans = container.querySelectorAll('.text-hidden span');
      const letterCount = visibleSpans.length;
      const startIndex = Math.floor(Math.random() * letterCount);

      gsap.to(visibleSpans, {
        yPercent: 100,
        ease: 'back.out(2)',
        duration: 0.6,
        stagger: {
          each: 0.023,
          from: startIndex,
        },
      });

      gsap.to(hiddenSpans, {
        yPercent: 100,
        ease: 'back.out(2)',
        duration: 0.6,
        stagger: {
          each: 0.023,
          from: startIndex,
        },
        onComplete: () => {
          gsap.set(visibleSpans, { clearProps: 'all' });
          gsap.set(hiddenSpans, { clearProps: 'all' });
        },
      });
    };

    const interval = setInterval(animate, 3000);
    return () => clearInterval(interval);
  }, []);

  const text = 'infrastructure';
  const letters = text.split('').map((char, i) =>
    char === ' ' ? (
      <span key={i} className="inline-block will-change-transform">
        {' '}
      </span>
    ) : (
      <span key={i} className="inline-block will-change-transform">
        {char}
      </span>
    )
  );

  return (
    <span
      ref={containerRef}
      className="relative overflow-hidden inline-block leading-[inherit] align-bottom"
    >
      <span className="text-visible inline-block">{letters}</span>
      <span className="text-hidden absolute bottom-full left-0 pointer-events-none">
        {letters}
      </span>
    </span>
  );
};

const Hero = () => {
  return (
    <section className="py-20 border-b border-b-gray-4">
      <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-12 p-10">
        <LLM /> <Infrastructure /> <span>that</span> <br />
        <span className="italic font-normal">grows</span> with your product
      </h1>
    </section>
  );
};

export default Hero;
