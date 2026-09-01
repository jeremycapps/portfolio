import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

inject();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
