import {
  emptyDatasetsStateContainer,
  emptyDatasetsStateContent,
  emptyDatasetsStateTitle,
} from './empty-datasets-state.css';

const EmptyDatasetsState = () => {
  return (
    <div className={emptyDatasetsStateContainer}>
      <div className={emptyDatasetsStateContent}>
        <h2 className={emptyDatasetsStateTitle}>
          No datasets yet. Create your first dataset to get started.
        </h2>
      </div>
    </div>
  );
};

export default EmptyDatasetsState;
