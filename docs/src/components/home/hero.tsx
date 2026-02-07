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

    // Measure widest state (expanded letter-spacing) and lock width
    el.style.fontWeight = '100';
    el.style.letterSpacing = '0.1em';
    const maxWidth = el.offsetWidth;
    el.style.width = `${maxWidth}px`;
    el.style.fontWeight = '';
    el.style.letterSpacing = '';

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-accent-9">{WORDS[index]}</span>;
};

const Hero = () => {
  return (
    <section className="py-20 border-b border-b-gray-4">
      <h1 className="text-4xl md:text-5xl font-pixel font-medium tracking-tight text-gray-12 p-10">
        <LLM /> <Infrastructure /> <span>that</span> <br />
        <Grows /> with your <Product />
      </h1>
    </section>
  );
};

export default Hero;
