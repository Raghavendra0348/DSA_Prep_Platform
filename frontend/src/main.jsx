import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from './lib/queryClient';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {import.meta.env.VITE_MAINTENANCE_MODE === 'true' ? (
      <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1>We’ll be back shortly</h1>
        <p>Scheduled maintenance is in progress. Your saved progress is safe.</p>
        <p>Please try again in a few minutes.</p>
      </main>
    ) : (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <App />
          {/* DevTools only included in development builds */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          )}
        </QueryClientProvider>
      </GoogleOAuthProvider>
    )}
  </StrictMode>,
);

