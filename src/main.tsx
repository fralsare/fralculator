import React from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyTheme } from './theme';
import './styles.css';

applyTheme(); // before first paint to avoid flash

const root = document.getElementById('root')!;
createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
