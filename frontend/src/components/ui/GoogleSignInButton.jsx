import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import Spinner from './Spinner';
import './GoogleSignInButton.css';

/**
 * Fully custom Google Sign-In button.
 *
 * Props:
 *  onCredential  {(token: string, type: string) => Promise<void>}
 *  text          {'signin' | 'signup'}
 *  className     extra class
 */
export default function GoogleSignInButton({ onCredential, text = 'signin', className = '' }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        await onCredential(tokenResponse.access_token, 'access_token');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  const label = text === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <motion.button
      type="button"
      className={`google-btn ${className}`}
      onClick={() => { if (!loading) handleLogin(); }}
      disabled={loading}
      aria-label={label}
      whileHover={{ scale: 1.012, y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className="google-btn-shimmer" aria-hidden="true" />
      <span className="google-btn-icon" aria-hidden="true">
        <GoogleGLogo />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            className="google-btn-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <Spinner size={15} />
            <span>Signing in…</span>
          </motion.span>
        ) : (
          <motion.span
            key="label"
            className="google-btn-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function GoogleGLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.653 32.591 29.25 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.232 0-9.622-3.417-11.284-8.156l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 36.476 44 30.655 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
