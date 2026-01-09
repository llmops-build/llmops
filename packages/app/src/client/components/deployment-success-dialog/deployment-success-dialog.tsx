import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Button } from '@ui';
import { Check, Copy, X } from 'lucide-react';
import { Icon } from '@client/components/icons';
import * as styles from './deployment-success-dialog.css';

type DeploymentSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentName: string;
  configSlug?: string;
  variantName?: string;
};

export function DeploymentSuccessDialog({
  open,
  onOpenChange,
  environmentName,
  configSlug,
  variantName,
}: DeploymentSuccessDialogProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.bootstrapData?.basePath === '/' ? '' : window.bootstrapData?.basePath || ''}/api/genai/v1`
      : '/api/genai/v1';

  const curlCommand = `curl ${baseUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "X-LLMOps-Config: ${configSlug || '<CONFIG_SLUG>'}" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <div className={styles.header}>
            <div className={styles.successIconContainer}>
              <Check size={24} />
            </div>
            <Dialog.Title className={styles.title}>
              Deployment Successful
            </Dialog.Title>
            <Dialog.Close className={styles.closeButton}>
              <X size={16} />
            </Dialog.Close>
          </div>

          <Dialog.Description className={styles.description}>
            {variantName ? (
              <>
                <strong>{variantName}</strong> has been deployed to the{' '}
                <strong>{environmentName}</strong> environment
                {configSlug && (
                  <>
                    {' '}
                    for config <strong>{configSlug}</strong>
                  </>
                )}
                .
              </>
            ) : (
              <>
                Successfully deployed to the <strong>{environmentName}</strong>{' '}
                environment.
              </>
            )}
          </Dialog.Description>

          <div className={styles.curlSection}>
            <div className={styles.curlHeader}>
              <span className={styles.curlLabel}>Test your deployment</span>
              <button
                type="button"
                className={styles.copyButton}
                onClick={copyToClipboard}
              >
                <Icon icon={copied ? Check : Copy} size="xs" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className={styles.curlCode}>{curlCommand}</pre>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
