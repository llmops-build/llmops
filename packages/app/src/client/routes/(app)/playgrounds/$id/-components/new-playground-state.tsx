import { logoWithDarkmode } from '@client/styles/logo.css';
import {
  newConfigStateContainer,
  newConfigStateContent,
  newConfigStateTitle,
} from '../../../prompts/$id/-components/new-config-state.css';
import Logo from '@client/components/icons/llmops.svg?react';

const NewPlaygroundState = () => {
  return (
    <div className={newConfigStateContainer}>
      <div className={newConfigStateContent}>
        <Logo
          style={{ height: 128, width: 128 }}
          className={logoWithDarkmode()}
        />
        <div>
          <h2 className={newConfigStateTitle}>
            Create a new playground by naming it above.
          </h2>
        </div>
      </div>
    </div>
  );
};

export default NewPlaygroundState;
