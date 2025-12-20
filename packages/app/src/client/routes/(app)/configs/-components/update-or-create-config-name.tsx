import { UpdateOrCreateName } from '../../-components/update-or-create-name';
import { useCreateConfig } from '@client/hooks/mutations/useCreateConfig';
import { useUpdateConfigName } from '@client/hooks/mutations/useUpdateConfigName';

const UpdateOrCreateConfigName = ({
  id,
  config,
}: {
  id: string | 'new';
  config?: { id: string; name: string };
}) => {
  const { mutateAsync: createConfig } = useCreateConfig();
  const { mutateAsync: updateConfigName } = useUpdateConfigName();

  return (
    <UpdateOrCreateName
      id={id}
      entity={config}
      placeholder="Config Name"
      onCreate={createConfig}
      onUpdate={updateConfigName}
    />
  );
};

export default UpdateOrCreateConfigName;
