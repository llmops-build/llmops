import DatasetSelector from './dataset-selector';
import { bottomSection, bottomToolbar, resultsPlaceholder } from '../index.css';

type DatasetResultsSectionProps = {
  datasetId: string | null;
  onDatasetChange: (datasetId: string | null) => void;
};

export function DatasetResultsSection({
  datasetId,
  onDatasetChange,
}: DatasetResultsSectionProps) {
  return (
    <div className={bottomSection}>
      <div className={bottomToolbar}>
        <div />
        <DatasetSelector value={datasetId} onChange={onDatasetChange} />
      </div>
      <div className={resultsPlaceholder}>
        {datasetId
          ? 'Run the playground to see results here'
          : 'Select a dataset to run prompts against multiple inputs'}
      </div>
    </div>
  );
}

export default DatasetResultsSection;
