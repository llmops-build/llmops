import {
  createFileRoute,
  Link,
  useMatches,
  useNavigate,
} from '@tanstack/react-router';
import {
  breadcrumbLink,
  chevronStyle,
  headerGroup,
  headerStyle,
} from './-components/_layout.css';
import { Breadcrumbs, Button, Header } from '@ui';
import { useSidebarWidth } from '@client/hooks/ui/useSidebarWidth';
import { ChevronRight, Columns2, Play, Plus } from 'lucide-react';
import { Icon } from '@client/components/icons';
import { gridElement, workingArea } from './-components/area.css';

import { PlaygroundsDataTable } from './playgrounds/-components/playgrounds-data-table';

export const Route = createFileRoute('/(app)/playgrounds')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Playgrounds',
      icon: <Icon icon={Play} />,
    },
  },
});

function RouteComponent() {
  const { toggleSidebar } = useSidebarWidth();
  const matches = useMatches();
  const navigate = useNavigate();

  const handleNavigateToNew = () => {
    // TODO: Update to '/playgrounds/$id' once the sub-route is created
    navigate({ to: '/playgrounds' });
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
        <div className={headerGroup}>
          <Button variant="outline" scheme="gray" onClick={handleNavigateToNew}>
            <Icon icon={Plus} className={chevronStyle} />
            New Playground
          </Button>
        </div>
      </Header>
      <div className={gridElement}>
        <div className={workingArea}>
          <PlaygroundsDataTable />
        </div>
      </div>
    </>
  );
}
