import type { Kysely } from 'kysely';
import type { Database } from '../schemas';
import type { DataLayer } from './interface';

import { createDatasetsDataLayer } from './datasets';
import { createLLMRequestsDataLayer } from './llmRequests';
import { createPlaygroundDataLayer } from './playgrounds';
import { createPlaygroundResultsDataLayer } from './playgroundResults';
import { createPlaygroundRunsDataLayer } from './playgroundRuns';
import { createTracesDataLayer } from './traces';
import { createWorkspaceSettingsDataLayer } from './workspaceSettings';

/**
 * Create all datalayers from a Kysely database instance.
 * Returns a flat object with all datalayer methods spread together.
 */
export function createDataLayer(db: Kysely<Database>): DataLayer {
  return {
    ...createDatasetsDataLayer(db),
    ...createLLMRequestsDataLayer(db),
    ...createPlaygroundDataLayer(db),
    ...createPlaygroundResultsDataLayer(db),
    ...createPlaygroundRunsDataLayer(db),
    ...createTracesDataLayer(db),
    ...createWorkspaceSettingsDataLayer(db),
  };
}
