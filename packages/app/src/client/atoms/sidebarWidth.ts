import { atom } from 'jotai';

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

export const sidebarWidthAtom = atom<string>(getInitialSidebarWidth());
