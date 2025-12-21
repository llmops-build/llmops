import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Form } from '@base-ui/react/form';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useDeleteEnvironment } from '@client/hooks/mutations/useDeleteEnvironment';
import * as styles from './-components/settings.css';

export const Route = createFileRoute(
  '/(app)/environments/$environment/_tabs/settings'
)({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Settings',
    },
  },
});

function RouteComponent() {
  const { environment: environmentId } = Route.useParams();
  const navigate = useNavigate();
  const deleteEnvironmentMutation = useDeleteEnvironment();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEnvironmentMutation.mutateAsync(environmentId);
      navigate({ to: '/environments' });
    } catch (error) {
      console.error('Failed to delete environment:', error);
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
                  Delete this environment
                </span>
                <span className={styles.dangerItemDescription}>
                  Once you delete an environment, there is no going back. Please
                  be certain.
                </span>
              </div>
              <AlertDialog.Root>
                <AlertDialog.Trigger className={styles.dangerButton}>
                  Delete Environment
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className={styles.backdrop} />
                  <AlertDialog.Popup className={styles.popup}>
                    <AlertDialog.Title className={styles.dialogTitle}>
                      Delete environment?
                    </AlertDialog.Title>
                    <AlertDialog.Description
                      className={styles.dialogDescription}
                    >
                      This action cannot be undone. This will permanently delete
                      the environment and all associated secrets.
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
