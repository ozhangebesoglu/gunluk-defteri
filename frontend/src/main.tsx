import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';

// --- Sentry Initialization ---
Sentry.init({
  dsn: "https://bdd8a60f6601c30d43db4d6207b37bac@o4509621108473856.ingest.de.sentry.io/4509621110112336",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performans İzleme
  tracesSampleRate: 1.0, 
  // Oturum Tekrarı
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0,
  // Ekstra Ayarlar
  environment: import.meta.env.MODE || 'development',
  sendDefaultPii: true, // PII verilerini gönder
});
console.log("Sentry (Frontend) initialized with new DSN.");
// --- End Sentry Initialization ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);