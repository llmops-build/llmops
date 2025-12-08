import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs, type BreadcrumbItem } from './breadcrumbs';
import { Home, Folder, File } from 'lucide-react';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicItems: BreadcrumbItem[] = [
  {
    key: 'home',
    label: <span>Home</span>,
  },
  {
    key: 'products',
    label: <span>Products</span>,
  },
  {
    key: 'electronics',
    label: <span>Electronics</span>,
  },
  {
    key: 'current',
    label: <span>Current Page</span>,
  },
];

const itemsWithIcons: BreadcrumbItem[] = [
  {
    key: 'home',
    prefix: <Home size={16} />,
    label: <span>Home</span>,
  },
  {
    key: 'documents',
    prefix: <Folder size={16} />,
    label: <span>Documents</span>,
  },
  {
    key: 'project',
    prefix: <Folder size={16} />,
    label: <span>Project Files</span>,
  },
  {
    key: 'file',
    prefix: <File size={16} />,
    label: <span>readme.txt</span>,
  },
];

const itemsWithLinks: BreadcrumbItem[] = [
  {
    key: 'home',
    prefix: <Home size={16} />,
    label: <a href="/">Home</a>,
  },
  {
    key: 'category',
    label: <a href="/category">Category</a>,
  },
  {
    key: 'subcategory',
    label: <a href="/category/subcategory">Subcategory</a>,
  },
  {
    key: 'current',
    label: <span>Current Page</span>,
  },
];

export const Default: Story = {
  args: {
    items: basicItems,
  },
};

export const WithIcons: Story = {
  args: {
    items: itemsWithIcons,
  },
};

export const WithLinks: Story = {
  args: {
    items: itemsWithLinks,
  },
};

export const CustomSeparator: Story = {
  args: {
    items: basicItems,
    separator: '>',
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      {
        key: 'single',
        prefix: <Home size={16} />,
        label: <span>Single Page</span>,
      },
    ],
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      {
        key: 'first',
        label: <a href="/">First</a>,
      },
      {
        key: 'second',
        label: <span>Second</span>,
      },
    ],
  },
};