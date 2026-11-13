import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from './lib/queryClient';
import { config } from './lib/config';
import './index.css';
import './styles/tailwind.css';
import App from './App.jsx';

const application = (
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.DEV && (
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    )}
  </QueryClientProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {import.meta.env.VITE_MAINTENANCE_MODE === 'true' ? (
      <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1>We’ll be back shortly</h1>
        <p>Scheduled maintenance is in progress. Your saved progress is safe.</p>
        <p>Please try again in a few minutes.</p>
      </main>
    ) : (
      config.googleClientId ? (
      <GoogleOAuthProvider clientId={config.googleClientId}>
        {application}
      </GoogleOAuthProvider>
      ) : application
    )}
  </StrictMode>,
);

