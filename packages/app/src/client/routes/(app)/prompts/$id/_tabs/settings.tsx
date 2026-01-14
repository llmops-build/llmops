import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Form } from '@base-ui/react/form';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useDeleteConfig } from '@client/hooks/mutations/useDeleteConfig';
import * as styles from './-components/settings.css';

export const Route = createFileRoute('/(app)/prompts/$id/_tabs/settings')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Settings',
    },
  },
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const navigate = useNavigate();
  const deleteConfigMutation = useDeleteConfig();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConfigMutation.mutateAsync(configId);
      navigate({ to: '/prompts' });
    } catch (error) {
      console.error('Failed to delete config:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <Form className={styles.settingsForm}>
        <div className={styles.settingsSection}>
          <h3 className={styles.settingsSectionTitle}>Danger Zone</h3>
          <div className={styles.dangerZone}>
            <div className={styles.dangerItem}>
              <div className={styles.dangerItemInfo}>
                <span className={styles.dangerItemTitle}>
                  Delete this config
                </span>
                <span className={styles.dangerItemDescription}>
                  Once you delete a config, there is no going back. Please be
                  certain.
                </span>
              </div>
              <AlertDialog.Root>
                <AlertDialog.Trigger className={styles.dangerButton}>
                  Delete Config
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className={styles.backdrop} />
                  <AlertDialog.Popup className={styles.popup}>
                    <AlertDialog.Title className={styles.dialogTitle}>
                      Delete config?
                    </AlertDialog.Title>
                    <AlertDialog.Description
                      className={styles.dialogDescription}
                    >
                      This action cannot be undone. This will permanently delete
                      the config and all associated variants and targeting
                      rules.
                    </AlertDialog.Description>
                    <div className={styles.dialogActions}>
                      <AlertDialog.Close className={styles.cancelButton}>
                        Cancel
                      </AlertDialog.Close>
                      <AlertDialog.Close
                        className={styles.confirmDeleteButton}
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialog.Close>
                    </div>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
