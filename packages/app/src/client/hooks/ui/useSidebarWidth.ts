import { useEffect, useState } from 'react';

const SIDEBAR_WIDTH_CSS_VAR = '--sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = '200px';

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidthState] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return (
        getComputedStyle(document.documentElement)
          .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
          .trim() || DEFAULT_SIDEBAR_WIDTH
      );
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const setSidebarWidth = (width: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(SIDEBAR_WIDTH_CSS_VAR, width);
      setSidebarWidthState(width);
    }
  };

  const resetSidebarWidth = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const currentWidth = getComputedStyle(document.documentElement)
        .getPropertyValue(SIDEBAR_WIDTH_CSS_VAR)
        .trim();
      if (currentWidth && currentWidth !== sidebarWidth) {
        setSidebarWidthState(currentWidth);
      }
    }
  }, [sidebarWidth]);

  return {
    sidebarWidth,
    setSidebarWidth,
    resetSidebarWidth,
  };
}
