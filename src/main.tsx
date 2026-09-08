import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/react';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

inject();

const root = document.getElementById('root')!;
const app = (
  <ErrorBoundary>
    <App />
    <SpeedInsights />
  </ErrorBoundary>
);

// Public routes include server-rendered HTML for crawlers and no-JS clients.
// React takes ownership once loaded; keeping this as a client render avoids
// coupling the interactive bundle to Suspense's server hydration protocol.
createRoot(root).render(app);
