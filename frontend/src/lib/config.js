/**
 * Runtime environment config with strict validation.
 * Dynamically resolves API URL for mobile devices on the same local network.
 */

function resolveApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;

  // In browser runtime (development on mobile / LAN):
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // If accessing via local network IP (e.g., 10.x.x.x, 192.168.x.x) or non-localhost
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If VITE_API_URL was set to localhost, redirect it to the PC's LAN IP on port 5000
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return `${protocol}//${hostname}:5000`;
      }
    }
  }

  return envUrl || 'http://localhost:5000';
}

export const config = {
  /** Base URL for all API requests */
  apiUrl: resolveApiUrl(),

  /** True when running in development mode */
  isDev: import.meta.env.DEV,

  /** True when running a production build */
  isProd: import.meta.env.PROD,

  /** App version from package.json (optional — set VITE_APP_VERSION in CI) */
  version: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
};

