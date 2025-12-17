import { Icon } from '@client/components/icons';
import { Button } from '@llmops/ui';
import { X } from 'lucide-react';
import { headerStyles } from './configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreateConfigName from './update-or-create-config-name';
import { useConfigList } from '@client/hooks/queries/useConfigList';

const ConfigsHeader = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { data } = useConfigList();

  const currentData = data?.find((config) => config.id === id);

  const handleClose = () => {
    navigate({ to: '/configs' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      <UpdateOrCreateConfigName id={id} config={currentData} />
    </div>
  );
};

export default ConfigsHeader;
