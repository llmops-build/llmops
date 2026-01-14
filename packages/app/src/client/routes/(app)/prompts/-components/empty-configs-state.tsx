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
          No prompts yet. Create your first prompt to get started.
        </h2>
      </div>
    </div>
  );
};

export default EmptyConfigsState;
