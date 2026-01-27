import { Icon } from '@client/components/icons';
import { Button } from '@ui';
import { X } from 'lucide-react';
import { headerStyles } from '../../../prompts/-components/configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreateDatasetName from './update-or-create-dataset-name';
import { useDatasetById } from '@client/hooks/queries/useDatasetById';

const DatasetsHeader = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useDatasetById(id ?? '');

  const handleClose = () => {
    navigate({ to: '/datasets' });
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      {id ? (
        <UpdateOrCreateDatasetName
          key={id}
          id={id}
          dataset={currentData ?? undefined}
        />
      ) : null}
    </div>
  );
};

export default DatasetsHeader;
