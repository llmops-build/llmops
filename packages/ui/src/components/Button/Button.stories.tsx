import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size variant',
    },
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'ghost', 'secondary'],
      description: 'Button style variant',
    },
    scheme: {
      control: 'select',
      options: ['default', 'destructive', 'gray'],
      description: 'Use destructive styling',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    size: 'default',
    variant: 'primary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    size: 'default',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    size: 'default',
    variant: 'ghost',
  },
};

export const DestructivePrimary: Story = {
  args: {
    children: 'Delete',
    size: 'default',
    variant: 'primary',
  },
};

export const DestructiveOutline: Story = {
  args: {
    children: 'Delete',
    size: 'default',
    variant: 'outline',
  },
};

export const DestructiveGhost: Story = {
  args: {
    children: 'Delete',
    size: 'default',
    variant: 'ghost',
  },
};
