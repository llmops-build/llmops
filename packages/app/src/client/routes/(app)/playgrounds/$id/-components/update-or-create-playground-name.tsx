import { UpdateOrCreateName } from '../../../-components/update-or-create-name';
import { useCreatePlayground } from '@client/hooks/mutations/useCreatePlayground';
import { useUpdatePlayground } from '@client/hooks/mutations/useUpdatePlayground';

const UpdateOrCreatePlaygroundName = ({
  id,
  playground,
}: {
  id: string | 'new';
  playground?: { id: string; name: string };
}) => {
  const { mutateAsync: createPlayground } = useCreatePlayground();
  const { mutateAsync: updatePlayground } = useUpdatePlayground();

  return (
    <UpdateOrCreateName
      id={id}
      entity={playground}
      placeholder="Playground Name"
      onCreate={createPlayground}
      onUpdate={updatePlayground}
    />
  );
};

export default UpdateOrCreatePlaygroundName;
