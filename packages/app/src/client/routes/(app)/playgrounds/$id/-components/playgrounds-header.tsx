import { Icon } from '@client/components/icons';
import { Button } from '@ui';
import { X } from 'lucide-react';
import { headerStyles } from '../../../prompts/-components/configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreatePlaygroundName from './update-or-create-playground-name';
import { usePlaygroundById } from '@client/hooks/queries/usePlaygroundById';

const PlaygroundsHeader = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = usePlaygroundById(id ?? '');

  const handleClose = () => {
    navigate({ to: '/playgrounds' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      {id ? (
        <UpdateOrCreatePlaygroundName
          key={id}
          id={id}
          playground={currentData ?? undefined}
        />
      ) : null}
    </div>
  );
};

export default PlaygroundsHeader;
