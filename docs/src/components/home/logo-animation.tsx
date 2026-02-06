'use client';

import { useEffect, useRef } from 'react';

function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    bg: style.getPropertyValue('--background').trim(),
    ghostBody: style.getPropertyValue('--ghost-body').trim(),
    ghostEyes: style.getPropertyValue('--ghost-eyes').trim(),
  };
}

const LogoAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef({ bg: '#fff', ghostBody: '#000', ghostEyes: '#fff' });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    colorsRef.current = getThemeColors();

    const observer = new MutationObserver(() => {
      colorsRef.current = getThemeColors();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    let sketch: import('p5').default | null = null;

    import('p5').then(({ default: p5 }) => {
      let blink = 0;
      let blinkDir = 0;
      const blinkSpeed = 0.25;

      let mouseNx = 0;
      let mouseNy = 0;
      let rotY = 0;
      let eyeOffsetX = 0;
      let eyeOffsetY = 0;

      const maxRotation = 0.5;
      const maxEyeShift = 80;
      const easing = 0.08;

      window.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseNx = Math.max(
          -1,
          Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2))
        );
        mouseNy = Math.max(
          -1,
          Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2))
        );
      });

      sketch = new p5((p: import('p5').default) => {
        p.setup = () => {
          const size = container.clientWidth;
          p.createCanvas(size, size);
        };

        p.draw = () => {
          // Blink logic
          if (blinkDir === 0 && blink === 0 && p.frameCount % 180 === 0) {
            blinkDir = 1;
          }
          if (blinkDir === 1) {
            blink += blinkSpeed;
            if (blink >= 1) {
              blink = 1;
              blinkDir = -1;
            }
          } else if (blinkDir === -1) {
            blink -= blinkSpeed;
            if (blink <= 0) {
              blink = 0;
              blinkDir = 0;
            }
          }

          // Smooth rotation and eye tracking
          const targetRotY = mouseNx * maxRotation;
          const targetEyeX = mouseNx * maxEyeShift;
          const targetEyeY = mouseNy * maxEyeShift * 0.5;

          rotY += (targetRotY - rotY) * easing;
          eyeOffsetX += (targetEyeX - eyeOffsetX) * easing;
          eyeOffsetY += (targetEyeY - eyeOffsetY) * easing;

          const cosR = Math.cos(rotY);
          const sinR = Math.sin(rotY);

          const { bg, ghostBody, ghostEyes } = colorsRef.current;
          const s = p.width / 2000;
          const cx = 1000;
          const tx = (x: number) => (cx + (x - cx) * cosR + sinR * 80) * s;
          const canvas = (p as unknown as { canvas: HTMLCanvasElement }).canvas;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Background
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, p.width, p.height);

          // Ghost body
          ctx.fillStyle = ghostBody;
          ctx.beginPath();
          ctx.moveTo(tx(500), 2000 * s);
          ctx.lineTo(tx(500), 1050 * s);
          ctx.bezierCurveTo(
            tx(500.705), 750.116 * s,
            tx(682.618), 600.065 * s,
            tx(1000), 600 * s,
          );
          ctx.bezierCurveTo(
            tx(1332.431), 602.05 * s,
            tx(1499.991), 750.677 * s,
            tx(1500), 1050 * s,
          );
          ctx.lineTo(tx(1500), 2000 * s);
          ctx.closePath();
          ctx.fill();

          // Eyes — perspective scaling per eye
          const eyeRy = 100 * (1 - blink) * s;
          const leftEyeX = tx(825 + eyeOffsetX);
          const rightEyeX = tx(1175 + eyeOffsetX);
          const eyeY = (1000 + eyeOffsetY) * s;

          // Eye closer to viewer is larger, farther is smaller
          // sinR > 0 = rotated right = left eye is nearer
          const nearScale = 1 + Math.abs(sinR) * 0.1;
          const farScale = 1 - Math.abs(sinR) * 0.1;
          const leftScale = sinR > 0 ? nearScale : farScale;
          const rightScale = sinR > 0 ? farScale : nearScale;

          const leftRx = 75 * Math.abs(cosR) * leftScale * s;
          const leftRy = eyeRy * leftScale;
          const rightRx = 75 * Math.abs(cosR) * rightScale * s;
          const rightRy = eyeRy * rightScale;

          ctx.fillStyle = ghostEyes;
          ctx.beginPath();
          ctx.ellipse(leftEyeX, eyeY, leftRx, leftRy, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(rightEyeX, eyeY, rightRx, rightRy, 0, 0, Math.PI * 2);
          ctx.fill();
        };
      }, container);
    });

    return () => {
      observer.disconnect();
      sketch?.remove();
    };
  }, []);

  return <div ref={containerRef} className="w-1/2 aspect-square mx-auto" />;
};

export default LogoAnimation;
