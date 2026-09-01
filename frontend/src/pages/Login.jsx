import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { login as apiLogin, googleLoginWithAccessToken as apiGoogleLogin } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
import CoolBlobEffect from '../components/ui/CoolBlobEffect';
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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/companies', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Sign In — DSA Prep';
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  // Google OAuth Handler (receives access_token from implicit flow)
  const handleGoogleCredential = async (accessToken) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGoogleLogin(accessToken);
      login(data);
      toast.success(`Welcome back, ${data.user?.name || 'User'}!`);
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Google sign-in failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!form.email.trim() || !form.password.trim()) {
      const msg = 'Please fill in all fields';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiLogin(form);
      login(data);
      toast.success(`Welcome back, ${data.user?.name || 'User'}!`);

      // Redirect to where they came from, or dashboard
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      let msg = 'Login failed. Please try again.';
      if (err.code === 'INVALID_CREDENTIALS') {
        msg = 'Invalid email or password';
      } else if (err.code === 'GOOGLE_ONLY_ACCOUNT') {
        msg = 'This account uses Google Sign-In. Please use the Google button above.';
      } else if (err.code === 'VALIDATION_ERROR') {
        msg = 'Please enter a valid email';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <CoolBlobEffect />
        <motion.div variants={itemVariants} className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </motion.div>

        {/* ── Google Sign-In ──────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="auth-google-wrapper">
          <GoogleSignInButton onCredential={handleGoogleCredential} text="signin" />
        </motion.div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="auth-divider">
          <span className="auth-divider-text">Or continue with email</span>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* ── Credentials Form ─────────────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <motion.div variants={itemVariants} className="auth-field">
            <label htmlFor="login-email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={17} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                name="email"
                className="auth-input-pill"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="auth-input-pill"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
          </motion.div>

          <motion.div variants={itemVariants}>
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
                  <span>Sign In with Email</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Sign up</Link>
        </motion.p>

        <motion.p variants={itemVariants} className="auth-terms">
          By continuing, you agree to our{' '}
          <a href="/terms">Terms of Service</a> and{' '}
          <a href="/privacy">Privacy Policy</a>.
        </motion.p>
      </motion.div>
    </div>
  );
}
