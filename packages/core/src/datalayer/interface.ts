import type { createDatasetsDataLayer } from './datasets';
import type { createPlaygroundDataLayer } from './playgrounds';
import type { createPlaygroundResultsDataLayer } from './playgroundResults';
import type { createPlaygroundRunsDataLayer } from './playgroundRuns';
import type { createWorkspaceSettingsDataLayer } from './workspaceSettings';

export type DatasetsDataLayer = ReturnType<typeof createDatasetsDataLayer>;
export type PlaygroundsDataLayer = ReturnType<typeof createPlaygroundDataLayer>;
export type PlaygroundResultsDataLayer = ReturnType<
  typeof createPlaygroundResultsDataLayer
>;
export type PlaygroundRunsDataLayer = ReturnType<
  typeof createPlaygroundRunsDataLayer
>;
export type WorkspaceSettingsDataLayer = ReturnType<
  typeof createWorkspaceSettingsDataLayer
>;

export type DataLayer = DatasetsDataLayer &
  PlaygroundsDataLayer &
  PlaygroundResultsDataLayer &
  PlaygroundRunsDataLayer &
  WorkspaceSettingsDataLayer;
