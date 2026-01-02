import { Link } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { BarChart3, DollarSign, List } from 'lucide-react';
import {
  observabilitySidebar,
  observabilitySidebarItem,
  observabilitySidebarSection,
  observabilitySidebarSectionTitle,
} from './observability-sidebar.css';

export function ObservabilitySidebar() {
  return (
    <nav className={observabilitySidebar}>
      <div className={observabilitySidebarSection}>
        <span className={observabilitySidebarSectionTitle}>Analytics</span>
        <Link to="/observability/overview" className={observabilitySidebarItem}>
          <Icon icon={BarChart3} />
          Overview
        </Link>
        <Link to="/observability/costs" className={observabilitySidebarItem}>
          <Icon icon={DollarSign} />
          Costs
        </Link>
      </div>
      <div className={observabilitySidebarSection}>
        <span className={observabilitySidebarSectionTitle}>Logs</span>
        <Link to="/observability/requests" className={observabilitySidebarItem}>
          <Icon icon={List} />
          Requests
        </Link>
      </div>
    </nav>
  );
}
