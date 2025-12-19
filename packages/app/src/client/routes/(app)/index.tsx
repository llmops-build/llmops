import { createFileRoute, useMatches } from '@tanstack/react-router';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from './-components/_layout.css';
import { Breadcrumbs, Button, Header } from '@llmops/ui';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { Blocks, ChevronRight, Columns2, SlidersVertical } from 'lucide-react';
import { Icon } from '@client/components/icons';
import { Link } from '@tanstack/react-router';
import { gridElement, workingArea } from './-components/area.css';
import clsx from 'clsx';
import {
  cardTitle,
  gettingStartedCard,
  gettingStartedCards,
  overviewContainer,
  sectionContainer,
  sectionTitle,
} from './-components/overview.css';

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
        <div className={headerGroup}></div>
      </Header>
      <div className={gridElement}>
        <div className={clsx(workingArea, overviewContainer)}>
          <div className={sectionContainer}>
            <h2 className={sectionTitle}>Get Started</h2>
            <div className={gettingStartedCards}>
              <Link
                to="/configs/$id"
                params={{ id: 'new' }}
                className={gettingStartedCard({ variant: 'primary' })}
              >
                <Icon icon={SlidersVertical} size="lg" />
                <span className={cardTitle}>Create New Config</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
