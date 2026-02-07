'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const RAINBOW = [
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#33ff00',
  '#0099ff',
  '#6633ff',
];

const LLM = () => {
  const trailRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const trail = trailRef.current;
    if (!trail) return;

    const bars = trail.children;

    // Animate each bar with a staggered wave (width oscillation)
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(bars, {
      scaleX: 0.4,
      duration: 0.3,
      ease: 'power1.inOut',
      stagger: {
        each: 0.05,
        yoyo: true,
        repeat: -1,
      },
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <span className="relative inline-block">
      <span
        ref={trailRef}
        className="absolute right-full top-1/2 -translate-y-1/2 h-[60%] w-6 flex flex-col gap-[2px] [mask-image:linear-gradient(to_right,transparent,black)]"
      >
        {RAINBOW.map((color) => (
          <span
            key={color}
            className="flex-1 origin-right"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="relative">LLM</span>
    </span>
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

const Grows = () => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    // Phase 1: Grow weight, tighten letter-spacing
    tl.fromTo(
      el,
      { fontWeight: 100, letterSpacing: '0em' },
      {
        fontWeight: 800,
        letterSpacing: '-0.12em',
        duration: 0.8,
        ease: 'power2.in',
      }
    );

    // Phase 2: Release — snap back to thin, expand letter-spacing
    tl.to(el, {
      fontWeight: 100,
      letterSpacing: '0.1em',
      duration: 0.4,
      ease: 'power3.out',
    });

    // Phase 3: Settle back to default
    tl.to(el, {
      fontWeight: 100,
      letterSpacing: '0em',
      duration: 0.6,
      ease: 'power2.inOut',
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <span ref={ref} className="italic font-thin inline-block">
      grows
    </span>
  );
};

const WORDS = ['product', 'Agents', 'Chatbots', 'APIs'];

const Product = () => {
  const [display, setDisplay] = useState('');
  const wordIndex = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const word = WORDS[wordIndex.current];

      if (!deleting) {
        charIndex++;
        setDisplay(word.slice(0, charIndex));
        if (charIndex === word.length) {
          // Pause before deleting
          timeout = setTimeout(() => {
            deleting = true;
            tick();
          }, 1500);
          return;
        }
      } else {
        charIndex--;
        setDisplay(word.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          wordIndex.current = (wordIndex.current + 1) % WORDS.length;
          // Small pause before typing next word
          timeout = setTimeout(tick, 300);
          return;
        }
      }

      timeout = setTimeout(tick, deleting ? 50 : 100);
    };

    tick();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <span className="text-accent-9">
      {display}
      <span className="inline-block w-[2px] h-[0.9em] bg-accent-9 align-middle ml-[1px] animate-pulse" />
    </span>
  );
};

const Hero = () => {
  return (
    <section className="py-20 border-b border-b-gray-4">
      <h1 className="text-4xl md:text-5xl font-pixel font-medium tracking-tight text-gray-12 p-10">
        <LLM /> <Infrastructure /> <span>that</span> <br />
        <Grows /> with your <Product />
      </h1>
      <p className="text-sm md:text-base text-gray-11 px-10 pb-10 max-w-2xl leading-relaxed">
        One SDK that gives you observability, prompt management, and evals for
        every LLM call. Install it with your first provider. The rest shows up
        when you need it.
      </p>
      <div className="px-10 pb-10">
        <a
          href="https://github.com/llmops-build/llmops"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-12 text-gray-1 rounded-md hover:bg-gray-11 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M8 .2C3.6.2 0 3.8 0 8.2c0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.5.8.5 1.6v2.4c0 .2.1.5.6.4C13.7 14.7 16 11.7 16 8.2 16 3.8 12.4.2 8 .2z" />
          </svg>
          Star on GitHub
        </a>
      </div>
    </section>
  );
};

export default Hero;
