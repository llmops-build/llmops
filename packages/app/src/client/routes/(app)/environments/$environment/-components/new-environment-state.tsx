import { logoWithDarkmode } from '@client/styles/logo.css';
import {
  newConfigStateContainer,
  newConfigStateContent,
  newConfigStateTitle,
} from '../../../configs/$id/-components/new-config-state.css';
import Logo from '@client/components/icons/llmops.svg?react';

const NewEnvironmentState = () => {
  return (
    <div className={newConfigStateContainer}>
      <div className={newConfigStateContent}>
        <Logo
          style={{ height: 128, width: 128 }}
          className={logoWithDarkmode()}
        />
        <div>
          <h2 className={newConfigStateTitle}>
            Create a new environment by naming the environment above.
          </h2>
        </div>
      </div>
    </div>
  );
};

export default NewEnvironmentState;
