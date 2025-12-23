import { Icon } from '@client/components/icons';
import { Button } from '@llmops/ui';
import { X, Copy, Check } from 'lucide-react';
import {
  headerStyles,
  configSlugStyles,
  configSlugText,
  copyButton,
} from './configs.css';
import { useNavigate } from '@tanstack/react-router';
import UpdateOrCreateConfigName from './update-or-create-config-name';
import { useConfigById } from '@client/hooks/queries/useConfigById';
import { useState } from 'react';

const ConfigsHeader = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useConfigById(id);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    navigate({ to: '/configs' });
  };

  const handleCopySlug = async () => {
    if (currentData?.slug) {
      await navigator.clipboard.writeText(currentData.slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={headerStyles}>
      <Button onClick={handleClose} size="icon" scheme="gray" variant="ghost">
        <Icon icon={X} />
      </Button>
      <UpdateOrCreateConfigName
        key={id}
        id={id}
        config={currentData ?? undefined}
      />
      {currentData?.slug && (
        <div className={configSlugStyles}>
          <span className={configSlugText}>{currentData.slug}</span>
          <button
            type="button"
            className={copyButton}
            onClick={handleCopySlug}
            aria-label="Copy config ID"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfigsHeader;
