import { Icon } from '@client/components/icons';
import { Button } from '@ui';
import { X, ArrowLeft } from 'lucide-react';
import { headerStyles } from '../../../-styles/shared-header.css';
import { useNavigate, useParams } from '@tanstack/react-router';
import UpdateOrCreatePlaygroundName from './update-or-create-playground-name';
import { usePlaygroundById } from '@client/hooks/queries/usePlaygroundById';

const PlaygroundsHeader = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = usePlaygroundById(id ?? '');
  const params = useParams({ strict: false });

  const isRowRoute = 'rowId' in params;

  const handleClose = () => {
    if (isRowRoute && id) {
      navigate({ to: '/playgrounds/$id', params: { id } });
    } else {
      navigate({ to: '/playgrounds' });
    }
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={isRowRoute ? ArrowLeft : X} />
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
