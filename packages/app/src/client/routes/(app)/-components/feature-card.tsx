import { Link } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import type { LucideIcon } from 'lucide-react';
import * as styles from './feature-card.css';

interface FeatureCardMetric {
  label: string;
  value: string | number;
}

interface FeatureCardProps {
  title: string;
  icon: LucideIcon;
  metrics: FeatureCardMetric[];
  actionLabel: string;
  actionTo: string;
}

export function FeatureCard({
  title,
  icon,
  metrics,
  actionLabel,
  actionTo,
}: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureCardHeader}>
        <Icon icon={icon} size="md" />
        <h3 className={styles.featureCardTitle}>{title}</h3>
      </div>
      <div className={styles.featureCardMetrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.featureCardMetric}>
            <span className={styles.featureCardMetricValue}>
              {metric.value}
            </span>
            <span className={styles.featureCardMetricLabel}>
              {metric.label}
            </span>
          </div>
        ))}
      </div>
      <Link to={actionTo} className={styles.featureCardAction}>
        {actionLabel}
      </Link>
    </div>
  );
}
