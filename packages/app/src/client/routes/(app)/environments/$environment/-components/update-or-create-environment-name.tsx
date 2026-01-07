import { UpdateOrCreateName } from '../../../-components/update-or-create-name';
import { useCreateEnvironment } from '@client/hooks/mutations/useCreateEnvironment';
import { useUpdateEnvironmentName } from '@client/hooks/mutations/useUpdateEnvironmentName';

const UpdateOrCreateEnvironmentName = ({
  id,
  environment,
}: {
  id: string | 'new';
  environment?: { id: string; name: string; isProd: boolean };
}) => {
  const { mutateAsync: createEnvironment } = useCreateEnvironment();
  const { mutateAsync: updateEnvironmentName } = useUpdateEnvironmentName();

  return (
    <UpdateOrCreateName
      id={id}
      disabled={environment?.isProd}
      tooltip={
        environment?.isProd
          ? "You can't rename Production environment."
          : undefined
      }
      entity={environment}
      placeholder="Environment Name"
      onCreate={createEnvironment}
      onUpdate={updateEnvironmentName}
    />
  );
};

export default UpdateOrCreateEnvironmentName;
