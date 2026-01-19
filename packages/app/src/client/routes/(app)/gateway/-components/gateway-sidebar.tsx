import { Link } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { Plug } from 'lucide-react';
import {
  gatewaySidebar,
  gatewaySidebarItem,
  gatewaySidebarSection,
  gatewaySidebarSectionTitle,
} from './gateway-sidebar.css';

export function GatewaySidebar() {
  return (
    <nav className={gatewaySidebar}>
      <div className={gatewaySidebarSection}>
        <span className={gatewaySidebarSectionTitle}>Configuration</span>
        <Link to="/gateway/providers" className={gatewaySidebarItem}>
          <Icon icon={Plug} />
          Providers
        </Link>
      </div>
    </nav>
  );
}
