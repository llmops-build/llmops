import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion';

const SIDEBAR_WIDTH_CSS_VAR = '--sidebar-width';

export enum SidebarWidthOptions {
  EXTENDED = '192px',
  COLLAPSED = '40px',
}

const getInitialSidebarWidth = (): string => {
  if (typeof document !== 'undefined') {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
        .trim() || SidebarWidthOptions.EXTENDED
    );
  }
  return SidebarWidthOptions.EXTENDED;
};

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidthState] = useState<string>(
    getInitialSidebarWidth
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    () => getInitialSidebarWidth() === SidebarWidthOptions.COLLAPSED
  );
  const animationRef = useRef<any>(null);

  const setSidebarWidth = (width: SidebarWidthOptions) => {
    if (typeof document !== 'undefined') {
      // Cancel any ongoing animation
      if (animationRef.current) {
        animationRef.current.cancel();
      }

      // Get current width value for animation from
      const currentWidth =
        getComputedStyle(document.documentElement)
          .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
          .trim() || sidebarWidth;

      // Only animate if the width is actually changing
      if (currentWidth !== width) {
        // Extract numeric values for animation
        const fromValue = parseFloat(currentWidth.replace(/[^\d.]/g, ''));
        const toValue = parseFloat(width.replace(/[^\d.]/g, ''));
        const unit = width.replace(/[\d.]/g, '');

        // Animate the CSS variable using Motion.dev API
        animationRef.current = animate(fromValue, toValue, {
          duration: 0.3, // 300ms
          ease: 'easeInOut',
          onUpdate: (value: number) => {
            document.documentElement.style.setProperty(
              SIDEBAR_WIDTH_CSS_VAR,
              `${value}${unit}`
            );
          },
          onPlay: () => {
            setIsCollapsed(width === SidebarWidthOptions.COLLAPSED);
          },
        });
      }

      // Update local state
      setSidebarWidthState(width);
    }
  };

  const toggleSidebar = () => {
    setSidebarWidth(
      isCollapsed ? SidebarWidthOptions.EXTENDED : SidebarWidthOptions.COLLAPSED
    );
    setIsCollapsed(!isCollapsed);
  };

  // Initialize CSS variable on mount and cleanup animation on unmount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Set initial CSS variable value if not already set
      const currentWidth = getComputedStyle(document.documentElement)
        .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
        .trim();

      if (!currentWidth) {
        document.documentElement.style.setProperty(
          SIDEBAR_WIDTH_CSS_VAR,
          sidebarWidth
        );
      }
    }

    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []); // Empty dependency array to run only on mount/unmount

  return {
    sidebarWidth,
    isCollapsed,
    setSidebarWidth,
    toggleSidebar,
  };
}
