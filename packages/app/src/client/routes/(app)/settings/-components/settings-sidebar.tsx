import { Link } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { Building2, Plug, User } from 'lucide-react';
import {
  settingsSidebar,
  settingsSidebarItem,
  settingsSidebarSection,
  settingsSidebarSectionTitle,
} from './settings-sidebar.css';

export function SettingsSidebar() {
  return (
    <nav className={settingsSidebar}>
      <div className={settingsSidebarSection}>
        <span className={settingsSidebarSectionTitle}>User</span>
        <Link to="/settings/user-profile" className={settingsSidebarItem}>
          <Icon icon={User} />
          Profile
        </Link>
      </div>
      <div className={settingsSidebarSection}>
        <span className={settingsSidebarSectionTitle}>Workspace</span>
        <Link to="/settings/workspace-general" className={settingsSidebarItem}>
          <Icon icon={Building2} />
          General
        </Link>
        <Link
          to="/settings/workspace-providers"
          className={settingsSidebarItem}
        >
          <Icon icon={Plug} />
          Providers
        </Link>
      </div>
    </nav>
  );
}
