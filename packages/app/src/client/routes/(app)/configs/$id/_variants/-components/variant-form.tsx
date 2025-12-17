import { type UseFormReturn } from 'react-hook-form';
import { configTitleInput } from '../../../-components/configs.css';

const VariantForm = ({ form }: { form: UseFormReturn<{ name: string }> }) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div>
      <input
        {...register('name', { required: 'Variant name is required' })}
        placeholder="Variant Name"
        aria-invalid={errors.name ? 'true' : 'false'}
        className={configTitleInput}
      />
      {errors.name && <span>{errors.name.message}</span>}
    </div>
  );
};

export default VariantForm;
