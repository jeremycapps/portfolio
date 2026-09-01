import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
    <Analytics />
  </ErrorBoundary>,
);
