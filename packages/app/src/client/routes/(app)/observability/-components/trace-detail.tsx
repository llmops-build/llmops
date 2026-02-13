import { useNavigate } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { X } from 'lucide-react';
import { Button } from '@ui';
import { sectionTitle } from './observability.css';

export function TraceDetail({ traceId }: { traceId: string }) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate({ to: '/observability/traces' });
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className={sectionTitle}>Trace Detail</h3>
        <Button variant="ghost" size="icon" scheme="gray" onClick={handleClose}>
          <Icon icon={X} size="sm" />
        </Button>
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--gray10)' }}>
        {traceId}
      </p>
    </div>
  );
}
