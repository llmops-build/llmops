import {
  emptyConfigsStateContainer,
  emptyConfigsStateContent,
  emptyConfigsStateTitle,
} from './empty-configs-state.css';

const EmptyConfigsState = () => {
  return (
    <div className={emptyConfigsStateContainer}>
      <div className={emptyConfigsStateContent}>
        <h2 className={emptyConfigsStateTitle}>
          No configs yet. Create your first config to get started.
        </h2>
      </div>
    </div>
  );
};

export default EmptyConfigsState;
