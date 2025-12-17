import { type UseFormReturn } from 'react-hook-form';
import { configTitleInput } from '../../../-components/configs.css';
import { Combobox } from '@llmops/ui';

const fruits = [
  'Apple',
  'Banana',
  'Orange',
  'Pineapple',
  'Grape',
  'Mango',
  'Strawberry',
  'Blueberry',
  'Raspberry',
  'Blackberry',
  'Cherry',
  'Peach',
  'Pear',
  'Plum',
  'Kiwi',
  'Watermelon',
  'Cantaloupe',
  'Honeydew',
  'Papaya',
  'Guava',
  'Lychee',
  'Pomegranate',
  'Apricot',
  'Grapefruit',
  'Passionfruit',
];

const VariantForm = ({ form }: { form: UseFormReturn<{ name: string }> }) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div>
        <input
          {...register('name', { required: 'Variant name is required' })}
          placeholder="Variant Name"
          aria-invalid={errors.name ? 'true' : 'false'}
          className={configTitleInput}
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>
      <div>
        <Combobox items={fruits} />
      </div>
    </>
  );
};

export default VariantForm;
