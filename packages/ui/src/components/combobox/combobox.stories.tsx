import type { Meta, StoryObj } from '@storybook/react';
import { Combobox, ComboboxMultiple } from './combobox';

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

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
];

export const Default: Story = {
  args: {
    items: fruits,
    label: 'Choose a fruit',
    placeholder: 'e.g. Apple',
  },
};

export const WithoutLabel: Story = {
  args: {
    items: fruits,
    placeholder: 'Select a fruit',
  },
};

export const Disabled: Story = {
  args: {
    items: fruits,
    label: 'Choose a fruit',
    placeholder: 'e.g. Apple',
    disabled: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    items: fruits,
    label: 'Choose a fruit',
    placeholder: 'e.g. Apple',
    defaultValue: 'Banana',
  },
};

export const Multiple: StoryObj<typeof ComboboxMultiple> = {
  render: (args) => <ComboboxMultiple {...args} />,
  args: {
    items: fruits,
    label: 'Choose fruits',
    placeholder: 'e.g. Apple',
    multiple: true,
  },
};

export const MultipleWithDefaultValue: StoryObj<typeof ComboboxMultiple> = {
  render: (args) => <ComboboxMultiple {...args} />,
  args: {
    items: fruits,
    label: 'Choose fruits',
    placeholder: 'e.g. Apple',
    multiple: true,
    defaultValue: ['Apple', 'Banana'],
  },
};

// Object items example
interface Language {
  id: string;
  name: string;
  code: string;
}

const languages: Language[] = [
  { id: '1', name: 'JavaScript', code: 'js' },
  { id: '2', name: 'TypeScript', code: 'ts' },
  { id: '3', name: 'Python', code: 'py' },
  { id: '4', name: 'Java', code: 'java' },
  { id: '5', name: 'C++', code: 'cpp' },
  { id: '6', name: 'Go', code: 'go' },
  { id: '7', name: 'Rust', code: 'rust' },
];

export const WithObjectItems: StoryObj<typeof Combobox<Language>> = {
  args: {
    items: languages,
    label: 'Choose a language',
    placeholder: 'e.g. TypeScript',
    itemToString: (item) => item?.name || '',
  },
};

export const MultipleWithObjectItems: StoryObj<typeof ComboboxMultiple<Language>> = {
  render: (args) => <ComboboxMultiple {...args} />,
  args: {
    items: languages,
    label: 'Choose languages',
    placeholder: 'e.g. TypeScript',
    multiple: true,
    itemToString: (item) => item?.name || '',
  },
};
