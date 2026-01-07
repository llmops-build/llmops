import { globalStyle } from '@vanilla-extract/css';
import './global.css';

globalStyle(':root', {
  vars: {
    '--sidebar-width': '200px',
  },
});

globalStyle('#storybook-root', {
  padding: 0,
});
