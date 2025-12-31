import { Icon } from '@client/components/icons';
import { useUpdateWorkspaceSettings } from '@client/hooks/mutations/useUpdateWorkspaceSettings';
import { useWorkspaceSettings } from '@client/hooks/queries/useWorkspaceSettings';
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import * as styles from '../-components/settings-form.css';

export const Route = createFileRoute(
  '/(app)/settings/_settings/workspace-general'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Workspace',
      icon: <Icon icon={Building2} />,
    },
  },
});

function RouteComponent() {
  const { data: settings, isLoading } = useWorkspaceSettings();
  const updateSettings = useUpdateWorkspaceSettings();

  const [name, setName] = useState('');

  // Sync state with fetched data
  useEffect(() => {
    if (settings?.name !== undefined) {
      setName(settings.name ?? '');
    }
  }, [settings?.name]);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    const currentName = settings?.name ?? '';

    // Only save if value has changed
    if (trimmedName !== currentName) {
      updateSettings.mutate({ name: trimmedName || null });
    }
  }, [name, settings?.name, updateSettings]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  if (isLoading) {
    return <div className={styles.settingsContainer}>Loading...</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsForm}>
        <div className={styles.settingsSection}>
          <div>
            <label className={styles.settingsFieldLabel}>
              Name of your workspace
            </label>
            <input
              type="text"
              className={styles.settingsInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Workspace name"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
