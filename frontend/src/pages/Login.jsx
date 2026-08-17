import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/companies', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Login — DSA Prep';
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
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
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={24} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to track your progress</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="login-email"
                type="email"
                name="email"
                className="input auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="login-password"
                type="password"
                name="password"
                className="input auth-input"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
