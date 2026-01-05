import { Link, useNavigate } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
} from '@ui';
import { Menu } from '@base-ui/react/menu';
import { Icon } from '@client/components/icons';
import {
  Blocks,
  ChevronDown,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Settings,
  SlidersVertical,
  Sun,
  Telescope,
} from 'lucide-react';
import {
  menuItem,
  menuItemIcon,
  menuPopup,
  menuPositioner,
  menuSection,
  menuSectionLabel,
  menuSeparator,
  sidebarSectionTitle,
  sidebarSectionTitleHidden,
  themeButton,
  themeButtonActive,
  themeButtonIcon,
  themeSwitcher,
  userAvatar,
  userEmail,
  userMenuChevron,
  userMenuTrigger,
  userMenuTriggerCollapsed,
} from './app-sidebar.css';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { useTheme, type Theme } from '@client/hooks/ui/useTheme';
import { authClient } from '@client/lib/auth';

function UserMenu() {
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebarWidth();

  const userEmailAddress = session?.user?.email ?? '';
  const userInitial = userEmailAddress.charAt(0).toUpperCase() || '?';

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: '/signin' });
  };

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
        <span className={userAvatar}>{userInitial}</span>
        {!isCollapsed && (
          <>
            <span className={userEmail}>{userEmailAddress}</span>
            <ChevronDown className={userMenuChevron} />
          </>
        )}
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
            <div className={menuSeparator} />
            <Menu.Item className={menuItem} onClick={handleLogout}>
              <LogOut className={menuItemIcon} />
              Logout
            </Menu.Item>
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
        <UserMenu />
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
          <Link to="/configs">
            <Icon icon={SlidersVertical} />
            Configs
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/environments">
            <Icon icon={Globe} />
            Environments
          </Link>
        </SidebarItem>
        <SidebarItem asChild>
          <Link to="/observability">
            <Icon icon={Telescope} />
            Observability
          </Link>
        </SidebarItem>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
