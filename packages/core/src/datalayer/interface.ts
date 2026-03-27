import type { createDatasetsDataLayer } from './datasets';
import type { createLLMRequestsDataLayer } from './llmRequests';
import type { createPlaygroundDataLayer } from './playgrounds';
import type { createPlaygroundResultsDataLayer } from './playgroundResults';
import type { createPlaygroundRunsDataLayer } from './playgroundRuns';
import type { createTracesDataLayer } from './traces';
import type { createWorkspaceSettingsDataLayer } from './workspaceSettings';

// Infer types from existing implementations
export type DatasetsDataLayer = ReturnType<typeof createDatasetsDataLayer>;
export type LLMRequestsDataLayer = ReturnType<
  typeof createLLMRequestsDataLayer
>;
export type PlaygroundsDataLayer = ReturnType<typeof createPlaygroundDataLayer>;
export type PlaygroundResultsDataLayer = ReturnType<
  typeof createPlaygroundResultsDataLayer
>;
export type PlaygroundRunsDataLayer = ReturnType<
  typeof createPlaygroundRunsDataLayer
>;
export type TracesDataLayer = ReturnType<typeof createTracesDataLayer>;
export type WorkspaceSettingsDataLayer = ReturnType<
  typeof createWorkspaceSettingsDataLayer
>;

// Combined flat interface (all methods spread together)
export type DataLayer = DatasetsDataLayer &
  LLMRequestsDataLayer &
  PlaygroundsDataLayer &
  PlaygroundResultsDataLayer &
  PlaygroundRunsDataLayer &
  TracesDataLayer &
  WorkspaceSettingsDataLayer;
