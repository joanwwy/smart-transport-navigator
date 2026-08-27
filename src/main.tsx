import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initClarity } from './utils/clarity.ts';

// Explicitly boot Clarity tracking
initClarity('y8vc1qbg2i');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

