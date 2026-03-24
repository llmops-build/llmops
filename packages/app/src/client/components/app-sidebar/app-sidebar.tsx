import { Link } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
} from '@ui';
import { Icon } from '@client/components/icons';
import {
  Blocks,
  BookOpen,
  Database,
  Monitor,
  Moon,
  Network,
  Play,
  Settings,
  Sun,
  Telescope,
} from 'lucide-react';
import {
  discordIcon,
  footerLink,
  menuPopup,
  menuPositioner,
  menuSection,
  menuSectionLabel,
  sidebarSectionTitle,
  sidebarSectionTitleHidden,
  themeButton,
  themeButtonActive,
  themeButtonIcon,
  themeSwitcher,
  userAvatar,
  userMenuTrigger,
  userMenuTriggerCollapsed,
} from './app-sidebar.css';
import Discord from '@client/components/icons/discord.svg?react';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { useTheme, type Theme } from '@client/hooks/ui/useTheme';
import { Menu } from '@base-ui/react/menu';

function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { isCollapsed } = useSidebarWidth();

  const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <Menu.Root>
      <Menu.Trigger
        className={`${userMenuTrigger} ${isCollapsed ? userMenuTriggerCollapsed : ''}`}
      >
        <span className={userAvatar}>L</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={menuPositioner}
          side="bottom"
          sideOffset={4}
          align="start"
          positionMethod="fixed"
        >
          <Menu.Popup className={menuPopup}>
            <div className={menuSection}>
              <div className={menuSectionLabel}>Theme</div>
              <div className={themeSwitcher}>
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`${themeButton} ${theme === option.value ? themeButtonActive : ''}`}
                    onClick={() => setTheme(option.value)}
                    title={option.label}
                    type="button"
                  >
                    <option.icon className={themeButtonIcon} />
                  </button>
                ))}
              </div>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function AppSidebar() {
  const { isCollapsed } = useSidebarWidth();

  return (
    <Sidebar>
      <SidebarHeader>
        <SettingsMenu />
      </SidebarHeader>
      <SidebarContent>
        <SidebarItem asChild>
          <Link to="/">
            <Icon icon={Blocks} />
            Overview
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/settings">
            <Icon icon={Settings} />
            Settings
          </Link>
        </SidebarItem>
        <span
          className={`${sidebarSectionTitle} ${isCollapsed ? sidebarSectionTitleHidden : ''}`}
        >
          Workspace
        </span>
        <SidebarItem asChild>
          <Link to="/gateway/usage">
            <Icon icon={Network} />
            Gateway
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/playgrounds">
            <Icon icon={Play} />
            Playgrounds
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/datasets">
            <Icon icon={Database} />
            Datasets
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/observability">
            <Icon icon={Telescope} />
            Observability
          </Link>
        </SidebarItem>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem asChild className={footerLink}>
          <a
            href="https://llmops.build/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon={BookOpen} />
            Documentation
          </a>
        </SidebarItem>
        <SidebarItem asChild className={footerLink}>
          <a
            href="https://llmops.build/discord"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={discordIcon}>
              <Discord />
            </span>
            Support
          </a>
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}
