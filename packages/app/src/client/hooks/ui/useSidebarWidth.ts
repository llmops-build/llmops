import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { animate } from 'motion';
import { isCollapsedAtom } from '../../atoms/sidebarWidth';

const SIDEBAR_WIDTH_CSS_VAR = '--sidebar-width';

export enum SidebarWidthOptions {
  EXTENDED = '192px',
  COLLAPSED = '40px',
}

export function useSidebarWidth() {
  const [isCollapsed, setIsCollapsed] = useAtom(isCollapsedAtom);
  const animationRef = useRef<any>(null);

  const setSidebarCollapsed = (collapsed: boolean) => {
    if (typeof document !== 'undefined' && collapsed !== isCollapsed) {
      const targetWidth = collapsed
        ? SidebarWidthOptions.COLLAPSED
        : SidebarWidthOptions.EXTENDED;

      // Cancel any ongoing animation
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }

      // Get current width value for animation from CSS
      const currentWidth =
        getComputedStyle(document.documentElement)
          .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
          .trim() || SidebarWidthOptions.EXTENDED;

      // Extract numeric values for comparison and animation
      const currentValue = parseFloat(currentWidth.replace(/[^\d.]/g, ''));
      const targetValue = parseFloat(targetWidth.replace(/[^\d.]/g, ''));

      // Only animate if the numeric values are different
      if (Math.abs(currentValue - targetValue) > 1) {
        // Use small threshold for float comparison
        const unit = targetWidth.replace(/[\d.]/g, '');
        // Animate the CSS variable using Motion.dev API
        animationRef.current = animate(currentValue, targetValue, {
          duration: 0.3, // 300ms
          ease: 'circInOut',
          onUpdate: (value: number) => {
            document.documentElement.style.setProperty(
              SIDEBAR_WIDTH_CSS_VAR,
              `${value}${unit}`
            );
          },
          onComplete: () => {
            animationRef.current = null;
            // Ensure final value is set correctly
            document.documentElement.style.setProperty(
              SIDEBAR_WIDTH_CSS_VAR,
              targetWidth
            );
          },
        });

        // Update atom state immediately so UI can react
        setIsCollapsed(collapsed);
      } else {
        // Just update the state if no animation is needed
        setIsCollapsed(collapsed);
        document.documentElement.style.setProperty(
          SIDEBAR_WIDTH_CSS_VAR,
          targetWidth
        );
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isCollapsed);
  };

  const collapseSidebar = () => {
    setSidebarCollapsed(true);
  };

  const expandSidebar = () => {
    setSidebarCollapsed(false);
  };

  // Initialize CSS variable on mount and cleanup animation on unmount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Get current CSS value
      const currentWidth = getComputedStyle(document.documentElement)
        .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
        .trim();

      // Determine the correct width based on atom state
      const correctWidth = isCollapsed
        ? SidebarWidthOptions.COLLAPSED
        : SidebarWidthOptions.EXTENDED;

      // Set CSS variable to match atom state (without animation on initial load)
      if (!currentWidth || currentWidth !== correctWidth) {
        document.documentElement.style.setProperty(
          SIDEBAR_WIDTH_CSS_VAR,
          correctWidth
        );
      }
    }

    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, []); // Empty dependency array to run only on mount/unmount

  return {
    isCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
  };
}
