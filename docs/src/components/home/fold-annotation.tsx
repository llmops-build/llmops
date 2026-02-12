'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

interface FoldAnnotationProps {
  text: string;
  target?: string;
  delay?: number;
  className?: string;
  variant?: 'dark' | 'light';
}

const FoldAnnotation = ({
  text,
  target,
  delay = 0,
  className = '',
  variant = 'dark',
}: FoldAnnotationProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const dotStartRef = useRef<SVGCircleElement>(null);
  const dotEndRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 16 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay });
      },
      onLeaveBack: () => {
        gsap.to(el, { opacity: 0, y: 16, duration: 0.3 });
      },
    });

    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!target) return;
    const el = ref.current;
    const line = lineRef.current;
    if (!el || !line) return;

    // Find the visible instance (serverCode renders in both mobile and desktop layouts)
    const candidates = document.querySelectorAll<HTMLElement>(
      `[data-annotation-id="${target}"]`
    );
    const targetEl = Array.from(candidates).find(
      (el) => el.offsetParent !== null
    );
    if (!targetEl) return;

    const update = () => {
      const aRect = el.getBoundingClientRect();
      const tRect = targetEl.getBoundingClientRect();

      const cy = aRect.height / 2;
      const x2 = tRect.right - aRect.left;
      const y2 = tRect.top + tRect.height / 2 - aRect.top;

      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));

      if (dotStartRef.current) {
        dotStartRef.current.setAttribute('cx', '0');
        dotStartRef.current.setAttribute('cy', String(cy));
      }
      if (dotEndRef.current) {
        dotEndRef.current.setAttribute('cx', String(x2));
        dotEndRef.current.setAttribute('cy', String(y2));
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [target]);

  return (
    <div
      ref={ref}
      className={`relative bg-gray-12/15 backdrop-blur-sm rounded-lg px-3 py-2 ${className}`}
    >
      {target && (
        <svg
          className="absolute top-0 left-0 pointer-events-none z-1 text-accent-10"
          overflow="visible"
        >
          <line ref={lineRef} stroke="currentColor" strokeWidth="1" />
          <circle ref={dotStartRef} r="3" fill="currentColor" />
          <circle ref={dotEndRef} r="3" fill="currentColor" />
        </svg>
      )}
      <p className={`text-sm max-w-xs leading-relaxed font-mono ${
        variant === 'light' ? 'text-gray-12/80' : 'text-gray-1/80'
      }`}>
        {text}
      </p>
    </div>
  );
};

export default FoldAnnotation;
