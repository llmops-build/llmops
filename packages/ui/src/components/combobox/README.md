# Combobox Component

A high-quality, accessible combobox component built on Base UI that combines an input with a filterable list of items.

## Features

- Single and multiple selection modes
- Keyboard navigation support
- Search/filter functionality
- Accessible (ARIA compliant)
- Styled with Vanilla Extract
- TypeScript support
- Support for both primitive and object items

## Usage

### Single Selection

```tsx
import { Combobox } from '@llmops/ui';

function MyComponent() {
  const fruits = ['Apple', 'Banana', 'Orange', 'Grape'];

  return (
    <Combobox
      items={fruits}
      label="Choose a fruit"
      placeholder="e.g. Apple"
      onValueChange={(value) => console.log('Selected:', value)}
    />
  );
}
```

### Multiple Selection

```tsx
import { ComboboxMultiple } from '@llmops/ui';

function MyComponent() {
  const fruits = ['Apple', 'Banana', 'Orange', 'Grape'];

  return (
    <ComboboxMultiple
      items={fruits}
      label="Choose fruits"
      placeholder="e.g. Apple"
      multiple
      onValueChange={(values) => console.log('Selected:', values)}
    />
  );
}
```

### With Object Items

```tsx
import { Combobox } from '@llmops/ui';

interface Language {
  id: string;
  name: string;
  code: string;
}

function MyComponent() {
  const languages: Language[] = [
    { id: '1', name: 'JavaScript', code: 'js' },
    { id: '2', name: 'TypeScript', code: 'ts' },
  ];

  return (
    <Combobox
      items={languages}
      label="Choose a language"
      placeholder="e.g. TypeScript"
      itemToString={(item) => item?.name || ''}
      onValueChange={(value) => console.log('Selected:', value)}
    />
  );
}
```

### Controlled Component

```tsx
import { Combobox } from '@llmops/ui';
import { useState } from 'react';

function MyComponent() {
  const [value, setValue] = useState<string | null>(null);
  const fruits = ['Apple', 'Banana', 'Orange', 'Grape'];

  return (
    <Combobox
      items={fruits}
      label="Choose a fruit"
      value={value}
      onValueChange={setValue}
    />
  );
}
```

## Props

### Combobox (Single Selection)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | - | Array of items to display in the list |
| `label` | `string` | - | Label text for the combobox |
| `placeholder` | `string` | `'Search...'` | Placeholder text for the input |
| `id` | `string` | - | HTML id attribute |
| `value` | `T \| null` | - | Controlled value |
| `defaultValue` | `T \| null` | - | Default uncontrolled value |
| `onValueChange` | `(value: T \| null) => void` | - | Callback when selection changes |
| `disabled` | `boolean` | `false` | Whether the combobox is disabled |
| `className` | `string` | - | Additional CSS class |
| `itemToString` | `(item: T \| null) => string` | - | Function to convert item to string for display |

### ComboboxMultiple (Multiple Selection)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | - | Array of items to display in the list |
| `label` | `string` | - | Label text for the combobox |
| `placeholder` | `string` | `'Search...'` | Placeholder text for the input |
| `id` | `string` | - | HTML id attribute |
| `value` | `T[]` | - | Controlled value (array) |
| `defaultValue` | `T[]` | - | Default uncontrolled value (array) |
| `onValueChange` | `(value: T[]) => void` | - | Callback when selection changes |
| `disabled` | `boolean` | `false` | Whether the combobox is disabled |
| `multiple` | `true` | `true` | Must be true for multiple selection |
| `className` | `string` | - | Additional CSS class |
| `itemToString` | `(item: T \| null) => string` | - | Function to convert item to string for display |

## Advanced Usage

For advanced use cases, you can use the `BaseCombobox` component directly from Base UI:

```tsx
import { BaseCombobox } from '@llmops/ui';

// Full control over all Base UI features
function AdvancedCombobox() {
  return (
    <BaseCombobox.Root>
      {/* Your custom implementation */}
    </BaseCombobox.Root>
  );
}
```

## Keyboard Navigation

- `ArrowDown` / `ArrowUp` - Navigate through items
- `Enter` - Select highlighted item
- `Escape` - Close popup
- `Tab` - Close popup and move focus
- Type to search/filter items

## Accessibility

The Combobox component follows WAI-ARIA patterns for combobox widgets and includes:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Label associations

## Styling

The component uses Vanilla Extract for styling. You can customize the appearance by:

1. Using the `className` prop to add custom styles
2. Modifying the styles in `combobox.css.ts`
3. Using CSS custom properties (tokens)

## Related Components

- [Select](/components/select) - For simple selection without search
- [Autocomplete](/components/autocomplete) - For free-form text input with suggestions
