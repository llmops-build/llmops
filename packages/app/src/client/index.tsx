import { App } from './app';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(<App />);
