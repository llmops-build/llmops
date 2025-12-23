import { Icon } from '@client/components/icons';
import { Button } from '@llmops/ui';
import { X } from 'lucide-react';
import { headerStyles } from './configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreateConfigName from './update-or-create-config-name';
import { useConfigById } from '@client/hooks/queries/useConfigById';

const ConfigsHeader = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useConfigById(id);

  const handleClose = () => {
    navigate({ to: '/configs' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      <UpdateOrCreateConfigName
        key={id}
        id={id}
        config={currentData ?? undefined}
      />
    </div>
  );
};

export default ConfigsHeader;
