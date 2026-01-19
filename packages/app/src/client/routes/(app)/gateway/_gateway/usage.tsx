import { createFileRoute } from '@tanstack/react-router';
import CurlIcon from '@client/components/icons/curl.svg?react';
import { CurlBuilder } from '../-components/curl-builder';
import * as styles from '../-components/curl-builder.css';
import { curlIcon } from '../-components/gateway-sidebar.css';

export const Route = createFileRoute('/(app)/gateway/_gateway/usage')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Curl',
      icon: (
        <span className={curlIcon}>
          <CurlIcon />
        </span>
      ),
    },
  },
});

function RouteComponent() {
  return (
    <div className={styles.usageContainer}>
      <div className={styles.usageHeader}>
        <h2 className={styles.usageTitle}>API Usage</h2>
        <p className={styles.usageDescription}>
          Use the interactive curl builder below to generate API requests. Click
          on the highlighted values to select from your configured providers,
          models, and environments.
        </p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Chat Completions</h3>
        <CurlBuilder />
      </div>
    </div>
  );
}
