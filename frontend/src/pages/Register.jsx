import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { register as apiRegister, googleLoginWithAccessToken as apiGoogleLogin } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';
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

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/companies', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Create Account — DSA Prep';
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name';
    if (!form.email.trim()) return 'Please enter your email';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Google OAuth Handler (receives access_token from implicit flow)
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRegister(form);
      login(data); // Auto-login after registration
      toast.success(`Account created! Welcome, ${data.user?.name || 'User'}!`);
      navigate('/companies', { replace: true });
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'EMAIL_EXISTS') {
        msg = 'An account with this email already exists';
      } else if (err.code === 'VALIDATION_ERROR') {
        msg = err.issues?.[0]?.message || 'Please check your input';
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
        <motion.div variants={itemVariants} className="auth-header">
          <h1>Create an account</h1>
          <p>Start your curated DSA preparation journey</p>
        </motion.div>

        {/* ── Google Sign-In / Sign-Up ─────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="auth-google-wrapper">
          <GoogleSignInButton onCredential={handleGoogleCredential} text="signup" />
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

        {/* ── Registration Form ────────────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <motion.div variants={itemVariants} className="auth-field">
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
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="auth-field">
            <label htmlFor="reg-email">Email</label>
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
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="auth-field">
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
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </motion.p>

        <motion.p variants={itemVariants} className="auth-terms">
          By clicking continue, you agree to our{' '}
          <a href="/terms">Terms of Service</a> and{' '}
          <a href="/privacy">Privacy Policy</a>.
        </motion.p>
      </motion.div>
    </div>
  );
}
