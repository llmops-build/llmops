import {
  getProviderFields,
  type ProviderFieldDefinition,
} from './provider-field-definitions';
import * as styles from './workspace-providers.css';

interface ProviderConfigFieldsProps {
  providerId: string | null;
  configValues: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
}

/**
 * Renders dynamic form fields based on the selected provider
 */
export function ProviderConfigFields({
  providerId,
  configValues,
  onChange,
}: ProviderConfigFieldsProps) {
  if (!providerId) {
    return null;
  }

  const fields = getProviderFields(providerId);

  return (
    <>
      {fields.map((field) => (
        <ProviderField
          key={field.name}
          field={field}
          value={configValues[field.name] || ''}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
    </>
  );
}

interface ProviderFieldProps {
  field: ProviderFieldDefinition;
  value: string;
  onChange: (value: string) => void;
}

function ProviderField({ field, value, onChange }: ProviderFieldProps) {
  const labelElement = (
    <label className={styles.dialogFieldLabel}>
      {field.label}
      {field.required && <span style={{ color: 'var(--error9)' }}> *</span>}
    </label>
  );

  const descriptionElement = field.description && (
    <span className={styles.fieldDescription}>{field.description}</span>
  );

  switch (field.type) {
    case 'select':
      return (
        <div className={styles.dialogField}>
          {labelElement}
          <select
            className={styles.dialogInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {!field.required && <option value="">Select...</option>}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {descriptionElement}
        </div>
      );

    case 'textarea':
      return (
        <div className={styles.dialogField}>
          {labelElement}
          <textarea
            className={styles.dialogTextarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
          {descriptionElement}
        </div>
      );

    case 'password':
      return (
        <div className={styles.dialogField}>
          {labelElement}
          <input
            type="password"
            className={styles.dialogInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {descriptionElement}
        </div>
      );

    case 'text':
    default:
      return (
        <div className={styles.dialogField}>
          {labelElement}
          <input
            type="text"
            className={styles.dialogInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
          {descriptionElement}
        </div>
      );
  }
}
