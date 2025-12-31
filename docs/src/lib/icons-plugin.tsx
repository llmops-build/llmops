import type { LoaderPlugin } from 'fumadocs-core/source';
import * as simpleIcons from 'simple-icons';
import { icons as lucideIcons } from 'lucide-react';
import { createElement } from 'react';

type SimpleIcon = {
  title: string;
  slug: string;
  svg: string;
  path: string;
  source: string;
  hex: string;
};

// Map of icon names to simple-icons keys
// Use the slug from https://simpleicons.org/
const simpleIconsMap: Record<string, string> = {
  Express: 'siExpress',
  Hono: 'siHono',
};

function SimpleIconComponent({ icon }: { icon: SimpleIcon }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-label={icon.title}
    >
      <path d={icon.path} />
    </svg>
  );
}

/**
 * Custom icon plugin that supports both Simple Icons and Lucide Icons.
 * For Simple Icons, use the icon name as defined in simpleIconsMap (e.g., "Express", "Hono")
 * For Lucide Icons, use the standard Lucide icon name (e.g., "Book", "Settings")
 */
export function customIconsPlugin(): LoaderPlugin {
  return {
    name: 'custom-icons',
    transformPageTree: {
      file: replaceIcon,
      folder: replaceIcon,
      separator: replaceIcon,
    },
  };

  function replaceIcon<T extends { icon?: unknown }>(node: T): T {
    if (node.icon === undefined || typeof node.icon !== 'string') return node;

    const iconName = node.icon;

    // Check Simple Icons first
    const simpleIconKey = simpleIconsMap[iconName];
    if (simpleIconKey && simpleIconKey in simpleIcons) {
      const icon = (simpleIcons as Record<string, SimpleIcon>)[simpleIconKey];
      if (icon) {
        node.icon = createElement(SimpleIconComponent, { icon });
        return node;
      }
    }

    // Fall back to Lucide Icons
    const LucideIcon = lucideIcons[iconName as keyof typeof lucideIcons];
    if (LucideIcon) {
      node.icon = createElement(LucideIcon);
      return node;
    }

    console.warn(`[custom-icons-plugin] Unknown icon: ${iconName}`);
    return node;
  }
}
