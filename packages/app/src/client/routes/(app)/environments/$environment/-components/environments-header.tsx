import { Icon } from '@client/components/icons';
import { Button } from '@ui';
import { X } from 'lucide-react';
import { headerStyles } from '../../../prompts/-components/configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreateEnvironmentName from './update-or-create-environment-name';
import { useEnvironmentById } from '@client/hooks/queries/useEnvironmentById';

const EnvironmentsHeader = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useEnvironmentById(id);

  const handleClose = () => {
    navigate({ to: '/environments' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      {id ? (
        <UpdateOrCreateEnvironmentName
          key={id}
          id={id}
          environment={currentData ?? undefined}
        />
      ) : null}
    </div>
  );
};

export default EnvironmentsHeader;
