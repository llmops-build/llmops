import { createFileRoute } from '@tanstack/react-router';
import ConfigsHeader from './-components/configs-header';
import { configTabsContainer } from './-components/configs.css';
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from '@llmops/ui';

export const Route = createFileRoute('/_layout/_layout/configs/_configs/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div>
      <ConfigsHeader id={id} />
      <div>
        <Tabs>
          <TabsList className={configTabsContainer}>
            <TabsTab name="variants" value="variants">
              <span>Variants</span>
            </TabsTab>
            <TabsTab name="settings" value="setting">
              <span>Settings</span>
            </TabsTab>
            <TabsIndicator />
          </TabsList>
          <TabsPanel value="variants">
            <div>Variants Content for config ID: {id}</div>
          </TabsPanel>
          <TabsPanel value="setting">
            <div>Settings Content for config ID: {id}</div>
          </TabsPanel>
        </Tabs>
      </div>
    </div>
  );
}
