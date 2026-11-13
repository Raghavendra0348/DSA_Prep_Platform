import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  absWorkingDir: frontend,
  stdin: {
    resolveDir: frontend,
    loader: 'jsx',
    contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { GoogleOAuthProvider } from '@react-oauth/google';
      import GoogleSignInButton from './src/components/ui/GoogleSignInButton.jsx';
      import { config } from './src/lib/config.js';
      import assert from 'node:assert/strict';

      assert.equal(config.googleClientId, '');
      for (const text of ['signin', 'signup']) {
        const html = renderToStaticMarkup(<GoogleSignInButton text={text} />);
        assert.match(html, /disabled/);
        assert.match(html, /Google sign-in unavailable/);
      }
      config.googleClientId = 'test-client.apps.googleusercontent.com';
      const html = renderToStaticMarkup(
        <GoogleOAuthProvider clientId={config.googleClientId}>
          <GoogleSignInButton text="signup" onCredential={async () => {}} />
        </GoogleOAuthProvider>
      );
      assert.match(html, /Sign up with Google/);
      assert.doesNotMatch(html, /Google sign-in unavailable/);
    `,
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  write: false,
  loader: { '.css': 'empty' },
  define: { 'import.meta.env': JSON.stringify({ VITE_GOOGLE_CLIENT_ID: '   ', DEV: true, PROD: false }) },
});
assert.equal(result.errors.length, 0);
const compiled = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(
  createRequire(import.meta.url), compiled, compiled.exports,
);
console.log('Google sign-in checks passed: missing config, email signup fallback, configured Google signup.');
