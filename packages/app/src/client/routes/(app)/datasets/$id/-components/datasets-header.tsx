import { Icon } from '@client/components/icons';
import { Button } from '@ui';
import { X, ArrowLeft } from 'lucide-react';
import { headerStyles } from '../../../-styles/shared-header.css';
import { useNavigate, useParams } from '@tanstack/react-router';
import UpdateOrCreateDatasetName from './update-or-create-dataset-name';
import { useDatasetById } from '@client/hooks/queries/useDatasetById';

const DatasetsHeader = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useDatasetById(id ?? '');
  const params = useParams({ strict: false });

  const isRecordRoute = 'recordId' in params;

  const handleClose = () => {
    if (isRecordRoute && id) {
      navigate({ to: '/datasets/$id', params: { id } });
    } else {
      navigate({ to: '/datasets' });
    }
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={isRecordRoute ? ArrowLeft : X} />
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
