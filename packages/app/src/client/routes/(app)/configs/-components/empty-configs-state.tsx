import { logoWithDarkmode } from '@client/styles/logo.css';
import {
  emptyConfigsStateContainer,
  emptyConfigsStateContent,
  emptyConfigsStateTitle,
} from './empty-configs-state.css';
import Logo from '@client/components/icons/llmops.svg?react';

const EmptyConfigsState = () => {
  return (
    <div className={emptyConfigsStateContainer}>
      <div className={emptyConfigsStateContent}>
        <Logo
          style={{ height: 128, width: 128 }}
          className={logoWithDarkmode()}
        />
        <div>
          <h2 className={emptyConfigsStateTitle}>
            No configs yet. Create your first config to get started.
          </h2>
        </div>
      </div>
    </div>
  );
};

export default EmptyConfigsState;
