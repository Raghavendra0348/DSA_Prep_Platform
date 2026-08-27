import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
  ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2
} from 'lucide-react';
import {
  sendOtp as apiSendOtp,
  resendOtp as apiResendOtp,
  verifyAndRegister as apiVerifyAndRegister,
  googleLoginWithAccessToken as apiGoogleLogin
} from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
import OtpInput from '../components/ui/OtpInput';
import Spinner from '../components/ui/Spinner';
import './Auth.css';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();

  // Multi-step: 1 = Form Details, 2 = Email OTP Verification
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Timers: 45s resend cooldown, 10m code expiry
  const [resendCooldown, setResendCooldown] = useState(45);
  const [expirySeconds, setExpirySeconds] = useState(600);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/companies', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = step === 1 ? 'Create Account — DSA Prep' : 'Verify Email — DSA Prep';
  }, [step]);

  // Resend cooldown countdown ticker
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Expiry countdown ticker
  useEffect(() => {
    if (step !== 2 || expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Please enter your name';
    if (!form.email.trim()) return 'Please enter your email';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Google OAuth Handler (1-click, already email-verified by Google)
  const handleGoogleCredential = async (accessToken) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGoogleLogin(accessToken);
      login(data);
      toast.success(`Welcome, ${data.user?.name || 'User'}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'Google sign-up failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1 Submit: Sends OTP to email
  const handleRequestOtp = async (e) => {
    e?.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiSendOtp(form.email.trim());
      setStep(2);
      setOtp('');
      setResendCooldown(45);
      setExpirySeconds(600);
      toast.success(`Verification code sent to ${form.email}`);
    } catch (err) {
      let msg = 'Failed to send verification code. Please try again.';
      if (err.code === 'EMAIL_EXISTS') {
        msg = 'An account with this email already exists. Please sign in.';
      } else if (err.code === 'TOO_MANY_REQUESTS') {
        msg = 'Please wait a moment before requesting another code.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
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
      const msg = err.message || 'Failed to resend code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Verifies OTP & registers user
  const handleVerifyAndRegister = useCallback(async (codeToVerify) => {
    const code = (codeToVerify || otp).trim();
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
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
      toast.success(`Welcome to DSA Prep, ${data.user?.name || 'Explorer'}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      let msg = 'Verification failed. Please check your code.';
      if (err.code === 'INVALID_OTP') {
        msg = 'Invalid or expired verification code. Please try again.';
      } else if (err.code === 'EMAIL_EXISTS') {
        msg = 'This email is already registered. Please sign in.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [otp, form, login, navigate, toast]);

  // Format MM:SS for expiry timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        key={step}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-header">
                <h1>Create an account</h1>
                <p>Start your curated DSA preparation journey</p>
              </div>

              {/* ── Google Sign-In / Sign-Up ──────────────────────────────── */}
              <div className="auth-google-wrapper">
                <GoogleSignInButton onCredential={handleGoogleCredential} text="signup" />
              </div>

              {/* ── Divider ───────────────────────────────────────────────── */}
              <div className="auth-divider">
                <span className="auth-divider-text">Or continue with email</span>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Registration Form ─────────────────────────────────────── */}
              <form className="auth-form" onSubmit={handleRequestOtp}>
                <div className="auth-field">
                  <label htmlFor="reg-name">Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={17} className="auth-input-icon" />
                    <input
                      id="reg-name"
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
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={17} className="auth-input-icon" />
                    <input
                      id="reg-email"
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
                </div>

                <div className="auth-field">
                  <label htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={17} className="auth-input-icon" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="auth-input-pill"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="auth-pw-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner size={16} />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              <p className="auth-switch">
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </p>

              <p className="auth-terms">
                By clicking continue, you agree to our{' '}
                <a href="/terms">Terms of Service</a> and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-otp-icon-glow">
                <ShieldCheck size={26} />
              </div>

              <div className="auth-header" style={{ marginBottom: 14 }}>
                <h1>Verify your email</h1>
                <p>We've sent a 6-digit verification code to</p>
                <div className="auth-otp-target">
                  <strong>{form.email}</strong>
                  <button
                    type="button"
                    className="auth-otp-change-btn"
                    onClick={() => { setStep(1); setError(''); }}
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

              {/* ── 6-Digit OTP Segmented Boxes ─────────────────────────── */}
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyAndRegister(); }}>
                <OtpInput
                  value={otp}
                  onChange={(val) => { setOtp(val); setError(''); }}
                  onComplete={(val) => handleVerifyAndRegister(val)}
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
                        <RefreshCw size={12} /> Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="auth-submit-btn"
                  disabled={loading || otp.length !== 6 || expirySeconds <= 0}
                >
                  {loading ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify & Create Account</span>
                    </>
                  )}
                </motion.button>

                <div className="auth-otp-back-wrap">
                  <button
                    type="button"
                    className="auth-otp-back-btn"
                    onClick={() => { setStep(1); setError(''); }}
                  >
                    <ArrowLeft size={14} /> Back to details
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

