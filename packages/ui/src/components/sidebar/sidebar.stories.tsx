import { Sidebar } from './sidebar';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

export const Primary = {
  render: () => (
    <div style={{ height: '400px', width: '300px' }}>
      <Sidebar style={{ '--sidebar-width': '300px' } as React.CSSProperties}>
        Hello
      </Sidebar>
    </div>
  ),
};
