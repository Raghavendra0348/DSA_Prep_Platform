import { useState, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
  ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2
} from 'lucide-react';
import {
  login as apiLogin,
  sendOtp as apiSendOtp,
  resendOtp as apiResendOtp,
  verifyAndRegister as apiVerifyAndRegister,
  googleLoginWithAccessToken as apiGoogleLogin
} from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import GoogleSignInButton from './GoogleSignInButton';
import OtpInput from './OtpInput';
import Spinner from './Spinner';
import '../../pages/Auth.css';
import './AuthModal.css';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Modern Authentication Modal Component supporting Google OAuth and Email Verification OTP
 */
export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <AuthModalDialog
          onClose={onClose}
          initialMode={initialMode}
          onSuccess={onSuccess}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}

function AuthModalDialog({ onClose, initialMode, onSuccess }) {
  const { login } = useAuth();
  const { toast } = useToast();

  // Mode: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Timers
  const [resendCooldown, setResendCooldown] = useState(45);
  const [expirySeconds, setExpirySeconds] = useState(600);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Resend cooldown ticker
  useEffect(() => {
    if (mode !== 'otp' || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, resendCooldown]);

  // Expiry countdown ticker
  useEffect(() => {
    if (mode !== 'otp' || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, expirySeconds]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // Google OAuth Handler (1-click)
  const handleGoogleCredential = async (accessToken) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGoogleLogin(accessToken);
      login(data);
      toast.success(`Welcome, ${data.user?.name || 'User'}!`);
      onSuccess?.(data.user);
      onClose?.();
    } catch (err) {
      const msg = err.message || 'Google authentication failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const data = await apiLogin({ email: form.email.trim(), password: form.password });
        login(data);
        toast.success(`Welcome back, ${data.user?.name || 'User'}!`);
        onSuccess?.(data.user);
        onClose?.();
      } else {
        // Register mode -> Send OTP and transition to 'otp'
        await apiSendOtp(form.email.trim());
        setMode('otp');
        setOtp('');
        setResendCooldown(45);
        setExpirySeconds(600);
        toast.success(`Verification code sent to ${form.email}`);
      }
    } catch (err) {
      let msg = 'Authentication failed. Please try again.';
      if (err.code === 'INVALID_CREDENTIALS') msg = 'Invalid email or password';
      else if (err.code === 'GOOGLE_ONLY_ACCOUNT') msg = 'This account uses Google Sign-In. Please use the Google button.';
      else if (err.code === 'EMAIL_EXISTS') msg = 'An account with this email already exists';
      else if (err.message) msg = err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError('');

    try {
      await apiResendOtp(form.email.trim());
      setResendCooldown(45);
      setExpirySeconds(600);
      setOtp('');
      toast.success('A fresh verification code has been sent.');
    } catch (err) {
      const msg = err.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async (codeToVerify) => {
    const code = (codeToVerify || otp).trim();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiVerifyAndRegister({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        code,
      });

      login(data);
      toast.success(`Account created! Welcome, ${data.user?.name || 'Explorer'}!`);
      onSuccess?.(data.user);
      onClose?.();
    } catch (err) {
      let msg = 'Verification failed. Please check your code.';
      if (err.code === 'INVALID_OTP') msg = 'Invalid or expired verification code';
      else if (err.message) msg = err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [otp, form, login, onSuccess, onClose, toast]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.div
        className="auth-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="auth-modal-panel"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        key={mode}
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {mode === 'otp' ? (
          <div>
            <div className="auth-otp-icon-glow">
              <ShieldCheck size={26} />
            </div>

            <div className="auth-modal-header" style={{ marginBottom: 12 }}>
              <h2 id={titleId}>Verify your email</h2>
              <p>We sent a 6-digit verification code to</p>
              <div className="auth-otp-target">
                <strong>{form.email}</strong>
                <button
                  type="button"
                  className="auth-otp-change-btn"
                  onClick={() => { setMode('register'); setError(''); }}
                >
                  Change
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
              <OtpInput
                value={otp}
                onChange={(val) => { setOtp(val); setError(''); }}
                onComplete={(val) => handleVerifyOtp(val)}
                disabled={loading || expirySeconds <= 0}
                length={6}
                autoFocus
              />

              <div className="auth-otp-timers">
                <span className={`auth-otp-expiry ${expirySeconds <= 60 ? 'auth-timer-warning' : ''}`}>
                  {expirySeconds > 0 ? `⏱️ Expires in ${formatTime(expirySeconds)}` : '⚠️ Code Expired'}
                </span>
                <div className="auth-otp-resend">
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-link"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      <RefreshCw size={12} /> Resend
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || otp.length !== 6 || expirySeconds <= 0}
              >
                {loading ? <Spinner size={16} /> : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>

              <div className="auth-otp-back-wrap">
                <button
                  type="button"
                  className="auth-otp-back-btn"
                  onClick={() => { setMode('register'); setError(''); }}
                >
                  <ArrowLeft size={14} /> Back to details
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <motion.div variants={itemVariants} className="auth-modal-header">
              <h2 id={titleId}>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
              <p>
                {mode === 'login'
                  ? 'Sign in to your account to continue'
                  : 'Start your curated DSA preparation journey'}
              </p>
            </motion.div>

            {/* ── Google Sign-In Button ──────────────────────────────────── */}
            <motion.div variants={itemVariants} className="auth-google-wrapper">
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                text={mode === 'login' ? 'signin' : 'signup'}
              />
            </motion.div>

            {/* ── Divider ──────────────────────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="auth-divider">
              <span className="auth-divider-text">Or continue with email</span>
            </motion.div>

            {error && (
              <motion.div
                variants={itemVariants}
                className="auth-error"
                role="alert"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* ── Form ─────────────────────────────────────────────────────────── */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <motion.div variants={itemVariants} className="auth-field">
                  <label htmlFor="modal-name">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input
                      id="modal-name"
                      type="text"
                      name="name"
                      className="auth-input-pill"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="auth-field">
                <label htmlFor="modal-email">Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="modal-email"
                    type="email"
                    name="email"
                    className="auth-input-pill"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="auth-field">
                <label htmlFor="modal-password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="auth-input-pill"
                    placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                    value={form.password}
                    onChange={handleChange}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In with Email' : 'Continue'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            <motion.p variants={itemVariants} className="auth-switch">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="btn-link"
                    style={{ background: 'none', border: 'none', color: 'var(--accent, #58a6ff)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setMode('register'); setError(''); }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="btn-link"
                    style={{ background: 'none', border: 'none', color: 'var(--accent, #58a6ff)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setMode('login'); setError(''); }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </motion.p>

            <motion.p variants={itemVariants} className="auth-terms">
              By continuing, you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>.
            </motion.p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

