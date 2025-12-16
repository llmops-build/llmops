import {
  Tabs as BaseTabs,
  type TabsRootProps,
  type TabsListProps,
  type TabsTabProps,
  type TabsIndicatorProps,
  type TabsPanelProps,
} from '@base-ui/react/tabs';

// Re-export Base UI Tabs components without custom styles
export const Tabs = BaseTabs.Root;
export const TabsList = BaseTabs.List;
export const TabsTab = BaseTabs.Tab;
export const TabsIndicator = BaseTabs.Indicator;
export const TabsPanel = BaseTabs.Panel;

// Re-export types
export type { TabsRootProps as TabsProps };
export type { TabsListProps as TabsListComponentProps };
export type { TabsTabProps };
export type { TabsIndicatorProps as TabsIndicatorComponentProps };
export type { TabsPanelProps };
