import { Link } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { Plug, SquareTerminal } from 'lucide-react';
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
        <span className={gatewaySidebarSectionTitle}>Documentation</span>
        <Link to="/gateway/usage" className={gatewaySidebarItem}>
          <Icon icon={SquareTerminal} />
          API Usage
        </Link>
      </div>
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
