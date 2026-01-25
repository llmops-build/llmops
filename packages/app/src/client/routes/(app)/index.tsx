import { createFileRoute, useMatches } from '@tanstack/react-router';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from './-components/_layout.css';
import { Breadcrumbs, Button, Header } from '@ui';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import {
  Blocks,
  Check,
  ChevronRight,
  Columns2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { Icon } from '@client/components/icons';
import { Link } from '@tanstack/react-router';
import { gridElement, workingArea } from './-components/area.css';
import clsx from 'clsx';
import * as styles from './-components/overview.css';
import { useConfigList } from '@client/hooks/queries/useConfigList';
import { useProviderConfigs } from '@client/hooks/queries/useProviderConfigs';
import { OnboardingFlow } from './-components/onboarding-flow';
import { QuickStats } from './-components/quick-stats';
import { InsightsSection } from './-components/insights-section';

import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/(app)/')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Overview',
      icon: <Icon icon={Blocks} />,
    },
  },
});

function RouteComponent() {
  const { toggleSidebar } = useSidebarWidth();
  const matches = useMatches();
  const { data: configs, isLoading: configsLoading } = useConfigList();
  const { data: providerConfigs, isLoading: providersLoading } =
    useProviderConfigs();
  const [copied, setCopied] = useState(false);
  // Track if we're in onboarding mode - null means we haven't determined yet
  const [isInOnboarding, setIsInOnboarding] = useState<boolean | null>(null);
  const initialCheckDone = useRef(false);

  const hasProviders = providerConfigs && providerConfigs.length > 0;
  const hasNoProviders = !providerConfigs || providerConfigs.length === 0;
  const isLoading = configsLoading || providersLoading;

  // Determine onboarding state only once when data first loads
  useEffect(() => {
    if (!isLoading && !initialCheckDone.current) {
      initialCheckDone.current = true;
      // Start onboarding if no providers exist
      if (hasNoProviders) {
        setIsInOnboarding(true);
      } else {
        setIsInOnboarding(false);
      }
    }
  }, [isLoading, hasNoProviders]);

  const handleOnboardingComplete = () => {
    setIsInOnboarding(false);
  };

  // Show onboarding when explicitly in onboarding mode
  const showOnboarding = isInOnboarding === true;

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.bootstrapData?.basePath === '/' ? '' : window.bootstrapData?.basePath || ''}/api/genai/v1`
      : '/api/genai/v1';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const breadcrumbItems = matches
    .filter(
      (match) =>
        Boolean(match.staticData.customData?.title) ||
        Boolean((match.loaderData as { title?: string } | undefined)?.title)
    )
    .map((match) => {
      const loaderTitle = (match.loaderData as { title?: string } | undefined)
        ?.title;
      const staticTitle = match.staticData.customData?.title as
        | string
        | undefined;
      const title = loaderTitle ?? staticTitle;

      return {
        key: match.id,
        label: (
          <Link to={match.pathname} className={breadcrumbLink}>
            {title}
          </Link>
        ),
        prefix: match.staticData.customData?.icon,
      };
    });

  // Still determining onboarding state - show nothing
  if (isInOnboarding === null) {
    return null;
  }

  // Show onboarding flow when no providers exist
  if (showOnboarding) {
    return (
      <>
        <Header className={headerStyle}>
          <div className={headerGroup}>
            <Button
              onClick={() => {
                toggleSidebar();
              }}
              size="icon"
              variant="ghost"
              scheme="gray"
            >
              <Icon icon={Columns2} />
            </Button>
            <Icon icon={ChevronRight} className={chevronStyle} />
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </Header>
        <div className={gridElement}>
          <div className={clsx(workingArea, styles.overviewContainer)}>
            <OnboardingFlow
              hasProviders={hasProviders}
              onComplete={handleOnboardingComplete}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header className={headerStyle}>
        <div className={headerGroup}>
          <Button
            onClick={() => {
              toggleSidebar();
            }}
            size="icon"
            variant="ghost"
            scheme="gray"
          >
            <Icon icon={Columns2} />
          </Button>
          <Icon icon={ChevronRight} className={chevronStyle} />
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </Header>
      <div className={gridElement}>
        <div className={clsx(workingArea, styles.overviewContainer)}>
          <div className={styles.overviewContent}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
              <h1 className={styles.heroTitle}>Mission Control</h1>
              <p className={styles.heroSubtitle}>
                Route requests to any provider. Manage prompts. Track
                everything.
              </p>
              <div className={styles.baseUrlSection}>
                <span className={styles.baseUrlLabel}>Base URL</span>
                <div className={styles.baseUrlContainer}>
                  <code className={styles.baseUrlCode}>{baseUrl}</code>
                  <button
                    type="button"
                    className={styles.baseUrlCopyButton}
                    onClick={copyToClipboard}
                    aria-label="Copy base URL"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats & Insights */}
            <QuickStats />
            <InsightsSection />

            {/* Quick Links */}
            <div className={styles.quickLinksSection}>
              <Link to="/gateway/usage" className={styles.quickLink}>
                <span className={styles.quickLinkText}>API Usage Guide</span>
                <ArrowRight size={16} className={styles.quickLinkArrow} />
              </Link>
              <Link to="/prompts" className={styles.quickLink}>
                <span className={styles.quickLinkText}>Manage Prompts</span>
                <span className={styles.quickLinkBadge}>
                  {configs?.length ?? 0}
                </span>
                <ArrowRight size={16} className={styles.quickLinkArrow} />
              </Link>
              <Link to="/observability/overview" className={styles.quickLink}>
                <span className={styles.quickLinkText}>View Analytics</span>
                <ArrowRight size={16} className={styles.quickLinkArrow} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
