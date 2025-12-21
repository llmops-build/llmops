import { useEnvironmentSecrets } from '@client/hooks/queries/useEnvironmentSecrets';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import * as styles from './secrets-table.css';

interface SecretsTableProps {
  environmentId: string;
}

const SecretsTable = ({ environmentId }: SecretsTableProps) => {
  const { data: secrets, isLoading } = useEnvironmentSecrets(environmentId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const handleCopy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskValue = (value: string) => {
    return '•'.repeat(Math.min(value.length, 32));
  };

  if (isLoading) {
    return <div className={styles.emptyState}>Loading secrets...</div>;
  }

  if (!secrets || secrets.length === 0) {
    return (
      <div className={styles.emptyState}>
        No secrets configured for this environment.
      </div>
    );
  }

  return (
    <div className={styles.secretsContainer}>
      <div className={styles.secretsSection}>
        <h3 className={styles.secretsSectionTitle}>API Keys</h3>
        <div className={styles.secretsZone}>
          {secrets.map((secret) => {
            const isVisible = visibleSecrets.has(secret.id);
            return (
              <div key={secret.id} className={styles.secretItem}>
                <div className={styles.secretItemInfo}>
                  <span className={styles.secretItemTitle}>
                    {secret.keyName}
                  </span>
                  <span className={styles.secretItemDescription}>
                    Use this key to authenticate API requests for this
                    environment.
                  </span>
                  <div className={styles.secretValueContainer}>
                    <span
                      className={
                        isVisible
                          ? styles.secretValue
                          : styles.secretValueHidden
                      }
                    >
                      {isVisible ? secret.keyValue : maskValue(secret.keyValue)}
                    </span>
                  </div>
                </div>
                <div className={styles.secretActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => toggleVisibility(secret.id)}
                    aria-label={isVisible ? 'Hide secret' : 'Show secret'}
                  >
                    {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => handleCopy(secret.keyValue, secret.id)}
                    aria-label="Copy to clipboard"
                  >
                    {copiedId === secret.id ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SecretsTable;
