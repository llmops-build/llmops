import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@ui';
import { Trash2, X } from 'lucide-react';
import * as styles from './delete-confirm-dialog.css';

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <Trash2 size={16} />
            </div>
            <Dialog.Title className={styles.title}>Delete Record</Dialog.Title>
            <Dialog.Close className={styles.closeButton}>
              <X size={16} />
            </Dialog.Close>
          </div>

          <Dialog.Description className={styles.description}>
            Are you sure you want to delete this record? This action cannot be
            undone.
          </Dialog.Description>

          <div className={styles.actions}>
            <Button
              variant="outline"
              scheme="gray"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              scheme="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
