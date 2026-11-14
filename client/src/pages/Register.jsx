import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useToast } from '../components/ui/Toast.jsx';

function validate(form) {
  const errors = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 2) errors.fullName = 'Name must be 2–100 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
    errors.password = 'Min 8 characters with a letter and a digit';
  }
  return errors;
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await register(form);
      toast.push('Account created');
      navigate('/profile');
    } catch (err) {
      toast.push(err.message || 'Could not register', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">It takes a minute. You can finish your profile next.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            name="fullName"
            value={form.fullName}
            error={errors.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creating…' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{' '}
          <Link className="font-semibold text-indigo-700" to="/login">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
