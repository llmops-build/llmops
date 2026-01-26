import {
  emptyPlaygroundsStateContainer,
  emptyPlaygroundsStateContent,
  emptyPlaygroundsStateTitle,
} from './empty-playgrounds-state.css';

const EmptyPlaygroundsState = () => {
  return (
    <div className={emptyPlaygroundsStateContainer}>
      <div className={emptyPlaygroundsStateContent}>
        <h2 className={emptyPlaygroundsStateTitle}>
          No playgrounds yet. Create your first playground to get started.
        </h2>
      </div>
    </div>
  );
};

export default EmptyPlaygroundsState;
