import { Icon } from '@client/components/icons';
import { Button } from '@llmops/ui';
import { X, Copy, Check, ArrowLeft } from 'lucide-react';
import {
  headerStyles,
  configSlugStyles,
  configSlugLabel,
  configSlugText,
  copyButton,
} from './configs.css';
import { useNavigate, useParams } from '@tanstack/react-router';
import UpdateOrCreateConfigName from './update-or-create-config-name';
import { useConfigById } from '@client/hooks/queries/useConfigById';
import { useState } from 'react';

const ConfigsHeader = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { data: currentData } = useConfigById(id);
  const [copied, setCopied] = useState(false);
  const params = useParams({ strict: false });

  const isVariantRoute = 'variant' in params;
  const isTargetingRoute = 'environment' in params;
  const isSubRoute = isVariantRoute || isTargetingRoute;

  const handleClose = () => {
    if (isVariantRoute) {
      navigate({ to: '/configs/$id/variants', params: { id } });
    } else if (isTargetingRoute) {
      navigate({ to: '/configs/$id/targeting', params: { id } });
    } else {
      navigate({ to: '/configs' });
    }
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
        <Icon icon={isSubRoute ? ArrowLeft : X} />
      </Button>
      <UpdateOrCreateConfigName
        key={id}
        id={id}
        config={currentData ?? undefined}
        disabled={isSubRoute}
      />
      {currentData?.slug && (
        <div className={configSlugStyles}>
          <span className={configSlugLabel}>Config Id</span>
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
