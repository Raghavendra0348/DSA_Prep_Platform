/**
 * Runtime environment config with strict validation.
 * Crashes early (at startup) if required variables are missing,
 * rather than failing silently at API call time.
 *
 * Add new variables here as the app grows.
 */

const required = ['VITE_API_URL'];

const missing = required.filter(key => !import.meta.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[config] Missing required environment variables:\n` +
    missing.map(k => `  - ${k}`).join('\n') +
    `\n\nCreate a .env file in the frontend/ directory with these values.`
  );
}

export const config = {
  /** Base URL for all API requests */
  apiUrl: import.meta.env.VITE_API_URL,

  /** True when running in development mode */
  isDev: import.meta.env.DEV,

  /** True when running a production build */
  isProd: import.meta.env.PROD,

  /** App version from package.json (optional — set VITE_APP_VERSION in CI) */
  version: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
};
