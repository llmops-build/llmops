import { useAtom } from 'jotai';
import { useEffect } from 'react';
import {
  sidebarWidthAtom,
  SidebarWidthOptions,
} from '../../atoms/sidebarWidth';

const SIDEBAR_WIDTH_CSS_VAR = '--sidebar-width';

export { SidebarWidthOptions };

export function useSidebarWidth() {
  const [sidebarWidth, setSidebarWidthState] = useAtom(sidebarWidthAtom);

  const setSidebarWidth = (width: SidebarWidthOptions) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(SIDEBAR_WIDTH_CSS_VAR, width);
      setSidebarWidthState(width);
    }
  };

  const resetSidebarWidth = () => {
    setSidebarWidth(SidebarWidthOptions.EXTENDED);
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
  }, [sidebarWidth, setSidebarWidthState]);

  return {
    sidebarWidth,
    setSidebarWidth,
    resetSidebarWidth,
  };
}
