import { UpdateOrCreateName } from '../../-components/update-or-create-name';
import { useCreateConfig } from '@client/hooks/mutations/useCreateConfig';
import { useUpdateConfigName } from '@client/hooks/mutations/useUpdateConfigName';

const UpdateOrCreateConfigName = ({
  id,
  config,
  disabled,
}: {
  id: string | 'new';
  config?: { id: string; name: string };
  disabled?: boolean;
}) => {
  const { mutateAsync: createConfig } = useCreateConfig();
  const { mutateAsync: updateConfigName } = useUpdateConfigName();

  return (
    <UpdateOrCreateName
      id={id}
      entity={config}
      placeholder="Prompt Name"
      onCreate={createConfig}
      onUpdate={updateConfigName}
      disabled={disabled}
    />
  );
};

export default UpdateOrCreateConfigName;
