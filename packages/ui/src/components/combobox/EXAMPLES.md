# Combobox Examples

## Basic Examples

### Simple String Items

```tsx
import { Combobox } from '@llmops/ui';

export function FruitSelector() {
  const fruits = ['Apple', 'Banana', 'Orange', 'Grape', 'Mango'];

  return (
    <Combobox
      items={fruits}
      label="Choose a fruit"
      placeholder="Search fruits..."
      onValueChange={(value) => console.log('Selected:', value)}
    />
  );
}
```

### Multiple Selection

```tsx
import { ComboboxMultiple } from '@llmops/ui';

export function MultipleTagSelector() {
  const tags = ['bug', 'feature', 'documentation', 'help-wanted', 'good-first-issue'];

  return (
    <ComboboxMultiple
      items={tags}
      label="Select tags"
      placeholder="Add tags..."
      multiple
      onValueChange={(values) => console.log('Selected tags:', values)}
    />
  );
}
```

### Controlled Component

```tsx
import { Combobox } from '@llmops/ui';
import { useState } from 'react';

export function ControlledCombobox() {
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const fruits = ['Apple', 'Banana', 'Orange', 'Grape'];

  return (
    <div>
      <Combobox
        items={fruits}
        label="Choose a fruit"
        value={selectedFruit}
        onValueChange={setSelectedFruit}
      />
      {selectedFruit && <p>You selected: {selectedFruit}</p>}
    </div>
  );
}
```

### With Object Items

```tsx
import { Combobox } from '@llmops/ui';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserSelector() {
  const users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  return (
    <Combobox
      items={users}
      label="Assign to user"
      placeholder="Search users..."
      itemToString={(user) => user?.name || ''}
      onValueChange={(user) => {
        if (user) {
          console.log('Assigned to:', user.name, user.email);
        }
      }}
    />
  );
}
```

### Form Integration

```tsx
import { Combobox } from '@llmops/ui';
import { useState } from 'react';

export function FormWithCombobox() {
  const [formData, setFormData] = useState({
    name: '',
    category: null as string | null,
  });

  const categories = ['Technology', 'Design', 'Marketing', 'Sales'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
      />
      
      <Combobox
        items={categories}
        label="Category"
        value={formData.category}
        onValueChange={(category) => setFormData({ ...formData, category })}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Advanced Examples

### Multiple Selection with Object Items

```tsx
import { ComboboxMultiple } from '@llmops/ui';

interface Label {
  id: string;
  name: string;
  color: string;
}

export function LabelSelector() {
  const labels: Label[] = [
    { id: '1', name: 'bug', color: 'red' },
    { id: '2', name: 'feature', color: 'blue' },
    { id: '3', name: 'documentation', color: 'green' },
  ];

  return (
    <ComboboxMultiple
      items={labels}
      label="Add labels"
      placeholder="Search labels..."
      multiple
      itemToString={(label) => label?.name || ''}
      onValueChange={(selectedLabels) => {
        console.log('Selected labels:', selectedLabels.map(l => l.name));
      }}
    />
  );
}
```

### Custom Styling

```tsx
import { Combobox } from '@llmops/ui';

export function StyledCombobox() {
  const items = ['Option 1', 'Option 2', 'Option 3'];

  return (
    <Combobox
      items={items}
      label="Custom styled combobox"
      className="my-custom-combobox"
      onValueChange={(value) => console.log(value)}
    />
  );
}
```

### With Default Value

```tsx
import { Combobox, ComboboxMultiple } from '@llmops/ui';

export function DefaultValueExample() {
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Go'];

  return (
    <div>
      {/* Single selection with default */}
      <Combobox
        items={languages}
        label="Preferred language"
        defaultValue="TypeScript"
      />

      {/* Multiple selection with defaults */}
      <ComboboxMultiple
        items={languages}
        label="Known languages"
        multiple
        defaultValue={['JavaScript', 'TypeScript']}
      />
    </div>
  );
}
```

### Disabled State

```tsx
import { Combobox } from '@llmops/ui';

export function DisabledCombobox() {
  const items = ['Item 1', 'Item 2', 'Item 3'];

  return (
    <Combobox
      items={items}
      label="Disabled combobox"
      disabled
      defaultValue="Item 1"
    />
  );
}
```

### Real-world Example: User Assignment

```tsx
import { ComboboxMultiple } from '@llmops/ui';
import { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function TaskAssignment() {
  const [assignedMembers, setAssignedMembers] = useState<TeamMember[]>([]);

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@team.com', role: 'Developer' },
    { id: '2', name: 'Bob Smith', email: 'bob@team.com', role: 'Designer' },
    { id: '3', name: 'Carol Williams', email: 'carol@team.com', role: 'Manager' },
  ];

  return (
    <div>
      <h2>Assign Task</h2>
      <ComboboxMultiple
        items={teamMembers}
        label="Assigned to"
        placeholder="Search team members..."
        multiple
        value={assignedMembers}
        onValueChange={setAssignedMembers}
        itemToString={(member) => member?.name || ''}
      />
      
      {assignedMembers.length > 0 && (
        <div>
          <h3>Assigned Members:</h3>
          <ul>
            {assignedMembers.map((member) => (
              <li key={member.id}>
                {member.name} ({member.role}) - {member.email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Integration with Other Components

### With Button Component

```tsx
import { Combobox, Button } from '@llmops/ui';
import { useState } from 'react';

export function ComboboxWithButton() {
  const [value, setValue] = useState<string | null>(null);
  const items = ['Option 1', 'Option 2', 'Option 3'];

  return (
    <div>
      <Combobox
        items={items}
        label="Select an option"
        value={value}
        onValueChange={setValue}
      />
      <Button onClick={() => setValue(null)}>
        Reset Selection
      </Button>
    </div>
  );
}
```
