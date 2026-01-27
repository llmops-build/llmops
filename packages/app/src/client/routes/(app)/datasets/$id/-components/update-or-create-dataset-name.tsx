import { UpdateOrCreateName } from '../../../-components/update-or-create-name';
import { useCreateDataset } from '@client/hooks/mutations/useCreateDataset';
import { useUpdateDataset } from '@client/hooks/mutations/useUpdateDataset';

const UpdateOrCreateDatasetName = ({
  id,
  dataset,
}: {
  id: string | 'new';
  dataset?: { id: string; name: string };
}) => {
  const { mutateAsync: createDataset } = useCreateDataset();
  const { mutateAsync: updateDataset } = useUpdateDataset();

  return (
    <UpdateOrCreateName
      id={id}
      entity={dataset}
      placeholder="Dataset Name"
      onCreate={createDataset}
      onUpdate={updateDataset}
    />
  );
};

export default UpdateOrCreateDatasetName;
