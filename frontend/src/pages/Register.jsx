import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { register as apiRegister } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/companies', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Register — DSA Prep';
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
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus size={24} />
          </div>
          <h1>Create Account</h1>
          <p>Start tracking your DSA progress</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                id="reg-name"
                type="text"
                name="name"
                className="input auth-input"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                className="input auth-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="reg-password"
                type="password"
                name="password"
                className="input auth-input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>
            <span className="auth-hint">Must be at least 6 characters</span>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <Spinner size={18} /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
