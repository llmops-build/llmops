import { logoWithDarkmode } from '@client/styles/logo.css';
import {
  newConfigStateContainer,
  newConfigStateContent,
} from './new-config-state.css';
import Logo from '@client/components/icons/llmops.svg?react';

const NewConfigState = () => {
  return (
    <div className={newConfigStateContainer}>
      <div className={newConfigStateContent}>
        <div className="">
          <Logo
            style={{ height: 128, width: 128 }}
            className={logoWithDarkmode()}
          />
        </div>
      </div>
    </div>
  );
};

export default NewConfigState;
