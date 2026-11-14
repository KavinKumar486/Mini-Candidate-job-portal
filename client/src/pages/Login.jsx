import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      const to = location.state?.from?.pathname || '/jobs';
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
      toast.push(err.message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to apply and track applications.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={error}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          New here?{' '}
          <Link className="font-semibold text-indigo-700" to="/register">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
