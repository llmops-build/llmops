import { Fragment } from 'react'
import { useForm } from 'react-hook-form';
import {
  configsContainer,
  configTitleInput,
  updateNameStatus,
} from '../configs/-components/configs.css';
import { Tooltip } from '@llmops/ui';

type UpdateOrCreateNameProps = {
  id: string | 'new';
  entity?: { id: string; name: string };
  placeholder: string;
  onCreate: (data: { name: string }) => Promise<unknown>;
  onUpdate: (data: { id: string; name: string }) => Promise<unknown>;
  disabled?: boolean;
  tooltip?: string;
};

export function UpdateOrCreateName({
  id,
  entity,
  placeholder,
  onCreate,
  onUpdate,
  disabled,
  tooltip,
}: UpdateOrCreateNameProps) {
  const isNew = id === 'new';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string }>({
    values: {
      name: entity?.name ?? '',
    },
  });

  const onSubmit = async (data: { name: string }) => {
    if (!data.name.trim() || disabled) {
      return;
    }
    try {
      if (isNew) {
        await onCreate({ name: data.name });
      } else {
        await onUpdate({ id: entity!.id, name: data.name });
      }
    } catch (error) {
      console.error('Error in creating/updating:', error);
    }
  };

  const input = (
    <input
      {...register('name', { required: `${placeholder} is required` })}
      placeholder={placeholder}
      data-1p-ignore
      title="name"
      className={configTitleInput}
      aria-invalid={errors.name ? 'true' : 'false'}
      disabled={disabled}
    />
  );

  const Comp = tooltip ? Tooltip : Fragment

  return (
    <Comp content={tooltip}>
      <form
        className={configsContainer}
        onBlur={handleSubmit(onSubmit)}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }}
      >
        {input}
        {isSubmitting &&
          (isNew ? (
            <span className={updateNameStatus}>Creating...</span>
          ) : (
            <span className={updateNameStatus}>Updating...</span>
          ))}
      </form>
    </Comp>
  );
}
