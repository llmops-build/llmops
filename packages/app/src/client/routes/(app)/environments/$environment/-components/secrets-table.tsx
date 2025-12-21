import { useEnvironmentSecrets } from '@client/hooks/queries/useEnvironmentSecrets';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Tooltip,
} from '@llmops/ui';
import { Info, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import * as styles from './secrets-table.css';

interface SecretsTableProps {
  environmentId: string;
}

const SecretsTable = ({ environmentId }: SecretsTableProps) => {
  const { data: secrets, isLoading } = useEnvironmentSecrets(environmentId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className={styles.secretsTableWrapper}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Key</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {secrets.map((secret) => (
              <TableRow key={secret.id}>
                <TableCell>
                  <div className={styles.typeCell}>
                    <span>{secret.keyName}</span>
                    <Tooltip content={`Secret key for ${secret.keyName}`}>
                      <span className={styles.infoIcon}>
                        <Info size={14} />
                      </span>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={styles.keyCell}>
                    <span className={styles.keyValue}>{secret.keyValue}</span>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => handleCopy(secret.keyValue, secret.id)}
                      aria-label="Copy to clipboard"
                    >
                      {copiedId === secret.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SecretsTable;
