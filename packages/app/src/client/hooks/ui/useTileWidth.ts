import { useRef } from 'react';
import { animate } from 'motion';

const TILE_WIDTH_CSS_VAR = '--tile-width';
const DEFAULT_TILE_WIDTH = '100%';

export function useTileWidth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);

  const setTileWidth = (targetWidth: string) => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Cancel any ongoing animation
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }

    // Get current width value for animation from CSS
    const currentWidth =
      getComputedStyle(container).getPropertyValue(TILE_WIDTH_CSS_VAR).trim() ||
      DEFAULT_TILE_WIDTH;

    // Extract numeric values for comparison and animation
    const currentValue = parseFloat(currentWidth.replace(/[^\d.]/g, ''));
    const targetValue = parseFloat(targetWidth.replace(/[^\d.]/g, ''));

    // Only animate if the numeric values are different
    if (Math.abs(currentValue - targetValue) > 1) {
      const unit = targetWidth.replace(/[\d.]/g, '');

      // Animate the CSS variable using Motion.dev API
      animationRef.current = animate(currentValue, targetValue, {
        duration: 0.3, // 300ms
        ease: 'circInOut',
        onUpdate: (value: number) => {
          container.style.setProperty(TILE_WIDTH_CSS_VAR, `${value}${unit}`);
        },
        onComplete: () => {
          animationRef.current = null;
          // Ensure final value is set correctly
          container.style.setProperty(TILE_WIDTH_CSS_VAR, targetWidth);
        },
      });
    } else {
      // Just update the value if no animation is needed
      container.style.setProperty(TILE_WIDTH_CSS_VAR, targetWidth);
    }
  };

  return {
    containerRef,
    setTileWidth,
  };
}
