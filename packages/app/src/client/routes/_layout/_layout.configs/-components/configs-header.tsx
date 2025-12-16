import { Icon } from '@client/components/icons';
import { Button } from '@llmops/ui';
import { X } from 'lucide-react';
import { headerStyles } from './header.css';
import { useNavigate } from '@tanstack/react-router';

const ConfigsHeader = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate({ to: '/configs' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
    </div>
  );
};

export default ConfigsHeader;
