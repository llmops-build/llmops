import { useState, useCallback } from 'react';
import type {
  GuardrailParameterSchema,
  GuardrailParameterProperty,
} from '@client/hooks/queries/useAvailableGuardrails';
import * as styles from './guardrails.css';

interface GuardrailFieldRendererProps {
  parameters: GuardrailParameterSchema;
  values: Record<string, unknown>;
  onChange: (fieldName: string, value: unknown) => void;
}

export function GuardrailFieldRenderer({
  parameters,
  values,
  onChange,
}: GuardrailFieldRendererProps) {
  if (!parameters.properties) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.entries(parameters.properties).map(([fieldName, config]) => (
        <GuardrailField
          key={fieldName}
          name={fieldName}
          config={config}
          value={values[fieldName]}
          required={parameters.required?.includes(fieldName)}
          onChange={(value) => onChange(fieldName, value)}
        />
      ))}
    </div>
  );
}

interface GuardrailFieldProps {
  name: string;
  config: GuardrailParameterProperty;
  value: unknown;
  required?: boolean;
  onChange: (value: unknown) => void;
}

function GuardrailField({
  name,
  config,
  value,
  required,
  onChange,
}: GuardrailFieldProps) {
  const description = config.description?.[0]?.text;

  // Render based on field type
  switch (config.type) {
    case 'boolean':
      return (
        <BooleanField
          name={name}
          label={config.label}
          description={description}
          value={value as boolean | undefined}
          defaultValue={config.default as boolean}
          onChange={onChange}
        />
      );

    case 'number':
      return (
        <NumberField
          name={name}
          label={config.label}
          description={description}
          value={value as number | undefined}
          defaultValue={config.default as number}
          required={required}
          onChange={onChange}
        />
      );

    case 'string':
      if (config.enum) {
        return (
          <SelectField
            name={name}
            label={config.label}
            description={description}
            value={value as string | undefined}
            defaultValue={config.default as string}
            options={config.enum}
            required={required}
            onChange={onChange}
          />
        );
      }
      return (
        <TextField
          name={name}
          label={config.label}
          description={description}
          value={value as string | undefined}
          defaultValue={config.default as string}
          required={required}
          onChange={onChange}
        />
      );

    case 'array':
      if (config.items?.enum) {
        return (
          <MultiSelectField
            name={name}
            label={config.label}
            description={description}
            value={value as string[] | undefined}
            options={config.items.enum}
            required={required}
            onChange={onChange}
          />
        );
      }
      return (
        <TagInputField
          name={name}
          label={config.label}
          description={description}
          value={value as string[] | undefined}
          required={required}
          onChange={onChange}
        />
      );

    case 'json':
    case 'object':
      return (
        <JsonField
          name={name}
          label={config.label}
          description={description}
          value={value}
          required={required}
          onChange={onChange}
        />
      );

    default:
      return (
        <TextField
          name={name}
          label={config.label}
          description={description}
          value={value as string | undefined}
          required={required}
          onChange={onChange}
        />
      );
  }
}

// Boolean field (checkbox)
function BooleanField({
  name,
  label,
  description,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: boolean | undefined;
  defaultValue?: boolean;
  onChange: (value: boolean) => void;
}) {
  const checked = value ?? defaultValue ?? false;

  return (
    <div className={styles.formField}>
      <div className={styles.formCheckbox}>
        <input
          type="checkbox"
          id={name}
          className={styles.checkboxInput}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <label htmlFor={name} className={styles.checkboxLabel}>
          {label}
        </label>
      </div>
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// Number field
function NumberField({
  name,
  label,
  description,
  value,
  defaultValue,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: number | undefined;
  defaultValue?: number;
  required?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.formField}>
      <label htmlFor={name} className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <input
        type="number"
        id={name}
        className={styles.formInput}
        value={value ?? defaultValue ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// Text field
function TextField({
  name,
  label,
  description,
  value,
  defaultValue,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: string | undefined;
  defaultValue?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.formField}>
      <label htmlFor={name} className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <input
        type="text"
        id={name}
        className={styles.formInput}
        value={value ?? defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// Select field (dropdown)
function SelectField({
  name,
  label,
  description,
  value,
  defaultValue,
  options,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: string | undefined;
  defaultValue?: string;
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.formField}>
      <label htmlFor={name} className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <select
        id={name}
        className={styles.formSelect}
        value={value ?? defaultValue ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// Multi-select field (checkboxes)
function MultiSelectField({
  name,
  label,
  description,
  value,
  options,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: string[] | undefined;
  options: string[];
  required?: boolean;
  onChange: (value: string[]) => void;
}) {
  const selected = value ?? [];

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={styles.formField}>
      <label className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <div className={styles.multiSelect}>
        {options.map((option) => (
          <label key={option} className={styles.multiSelectOption}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={selected.includes(option)}
              onChange={() => handleToggle(option)}
            />
            <span className={styles.checkboxLabel}>{option}</span>
          </label>
        ))}
      </div>
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// Tag input field (for string arrays)
function TagInputField({
  name,
  label,
  description,
  value,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: string[] | undefined;
  required?: boolean;
  onChange: (value: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const tags = value ?? [];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
          onChange([...tags, newTag]);
        }
        setInputValue('');
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        onChange(tags.slice(0, -1));
      }
    },
    [inputValue, tags, onChange],
  );

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={styles.formField}>
      <label className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <div className={styles.tagInput}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => handleRemoveTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.tagInputField}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Type and press Enter...' : ''}
        />
      </div>
      {description && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}

// JSON field (textarea)
function JsonField({
  name,
  label,
  description,
  value,
  required,
  onChange,
}: {
  name: string;
  label: string;
  description?: string;
  value: unknown;
  required?: boolean;
  onChange: (value: unknown) => void;
}) {
  const [textValue, setTextValue] = useState(() => {
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);

    if (!newValue.trim()) {
      setError(null);
      onChange(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(newValue);
      setError(null);
      onChange(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div className={styles.formField}>
      <label htmlFor={name} className={styles.formFieldLabel}>
        {label}
        {required && ' *'}
      </label>
      <textarea
        id={name}
        className={styles.formTextarea}
        value={textValue}
        onChange={handleChange}
        placeholder='{"key": "value"}'
      />
      {error && (
        <span
          className={styles.formFieldDescription}
          style={{ color: 'var(--error11)' }}
        >
          {error}
        </span>
      )}
      {description && !error && (
        <span className={styles.formFieldDescription}>{description}</span>
      )}
    </div>
  );
}
