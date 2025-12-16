import { useForm } from 'react-hook-form';
import { configsContainer, configTitle, updateNameStatus } from './configs.css';
import { useEffect } from 'react';
import { useCreateConfig } from '@client/hooks/mutations/useCreateConfig';
import { useUpdateConfigName } from '@client/hooks/mutations/useUpdateConfigName';

const CreateConfig = ({
  isNew,
  config,
}: {
  isNew: boolean;
  config?: { id: string; name: string };
}) => {
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: config?.name || '',
    },
  });
  const { mutateAsync: createConfig } = useCreateConfig();
  const { mutateAsync: updateConfigName } = useUpdateConfigName();

  useEffect(() => {
    if (config?.name) {
      reset({ name: config.name });
    } else if (isNew) {
      reset({ name: '' });
    }
  }, [config?.name]);

  const onSubmit = async (data: { name: string }) => {
    try {
      isNew
        ? await createConfig({ name: data.name })
        : await updateConfigName({ id: config!.id, name: data.name });
      console.log('Config created with name:', data.name);
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  };

  return (
    <form className={configsContainer} onBlur={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Config name is required' })}
        placeholder="Config Name"
        title="title"
        className={configTitle}
        aria-invalid={errors.name ? 'true' : 'false'}
      />
      {isSubmitting &&
        (isNew ? (
          <span className={updateNameStatus}>Creating...</span>
        ) : (
          <span className={updateNameStatus}>Updating...</span>
        ))}
    </form>
  );
};

const UpdateOrCreateConfigName = ({
  id,
  config,
}: {
  id: string | 'new';
  config?: { id: string; name: string };
}) => {
  const isNew = id === 'new';
  return <CreateConfig isNew={isNew} config={config} />;
};

export default UpdateOrCreateConfigName;
