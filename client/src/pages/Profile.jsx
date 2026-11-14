import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiUrl } from '../api/client.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input, TextArea } from '../components/ui/Input.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const EMPTY = {
  fullName: '',
  phone: '',
  location: '',
  headline: '',
  summary: '',
  skillsText: '',
  experienceYears: '',
  currentTitle: '',
  linkedinUrl: '',
  githubUrl: '',
};

export function Profile() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api('/api/profile'),
  });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);

  useEffect(() => {
    if (!data?.profile) return;
    const p = data.profile;
    setForm({
      fullName: p.fullName || '',
      phone: p.phone || '',
      location: p.location || '',
      headline: p.headline || '',
      summary: p.summary || '',
      skillsText: (p.skills || []).join(', '),
      experienceYears: p.experienceYears ?? '',
      currentTitle: p.currentTitle || '',
      linkedinUrl: p.linkedinUrl || '',
      githubUrl: p.githubUrl || '',
    });
    setDirty(false);
  }, [data]);

  useEffect(() => {
    const onLeave = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  function change(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function validate() {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Required (2–100 characters)';
    if (form.phone && !/^(\+91[6-9]\d{9}|[6-9]\d{9}|\+[1-9]\d{9,14})$/.test(form.phone.trim())) {
      next.phone = 'Indian 10-digit or E.164';
    }
    if (form.summary.length > 2000) next.summary = 'Max 2000 characters';
    return next;
  }

  async function save(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const skills = form.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api('/api/profile', {
        method: 'PATCH',
        body: {
          fullName: form.fullName,
          phone: form.phone,
          location: form.location,
          headline: form.headline,
          summary: form.summary,
          skills,
          experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
          currentTitle: form.currentTitle,
          linkedinUrl: form.linkedinUrl,
          githubUrl: form.githubUrl,
        },
      });
      setDirty(false);
      toast.push('Profile saved');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onResume(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const okType = /\.(pdf|doc|docx)$/i.test(file.name);
    if (!okType) {
      toast.push('Only pdf, doc, and docx files are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.push('File must be 5 MB or smaller', 'error');
      return;
    }
    const body = new FormData();
    body.append('resume', file);
    setUploadPct(10);
    try {
      await api('/api/profile/resume', { method: 'POST', body });
      setUploadPct(100);
      toast.push('Resume uploaded');
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setTimeout(() => setUploadPct(null), 800);
    }
  }

  if (isLoading) return <Spinner />;
  const completeness = data?.profile?.profileCompleteness ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={save}>
          <Input label="Full name" value={form.fullName} error={errors.fullName} onChange={(e) => change('fullName', e.target.value)} />
          <Input label="Phone" value={form.phone} error={errors.phone} onChange={(e) => change('phone', e.target.value)} />
          <Input label="Location" value={form.location} onChange={(e) => change('location', e.target.value)} />
          <Input label="Current title" value={form.currentTitle} onChange={(e) => change('currentTitle', e.target.value)} />
          <Input label="Headline" className="sm:col-span-2" value={form.headline} onChange={(e) => change('headline', e.target.value)} />
          <div className="sm:col-span-2">
            <TextArea label="Summary" rows={5} value={form.summary} error={errors.summary} onChange={(e) => change('summary', e.target.value)} />
          </div>
          <Input
            label="Skills (comma separated)"
            className="sm:col-span-2"
            value={form.skillsText}
            onChange={(e) => change('skillsText', e.target.value)}
          />
          <Input
            label="Years of experience"
            type="number"
            min="0"
            max="50"
            value={form.experienceYears}
            onChange={(e) => change('experienceYears', e.target.value)}
          />
          <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => change('linkedinUrl', e.target.value)} />
          <Input label="GitHub URL" className="sm:col-span-2" value={form.githubUrl} onChange={(e) => change('githubUrl', e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
            {dirty && <span className="ml-3 text-sm text-amber-700">Unsaved changes</span>}
          </div>
        </form>
      </Card>
      <div className="space-y-4">
        <Card>
          <p className="text-sm font-medium text-slate-600">Profile completeness</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-indigo-600" style={{ width: `${completeness}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-500">{completeness}% complete</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-600">Resume</p>
          <input className="mt-3 block w-full text-sm" type="file" accept=".pdf,.doc,.docx" onChange={onResume} />
          {uploadPct !== null && (
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          {data?.profile?.hasResume && (
            <button
              type="button"
              className="mt-3 inline-block text-sm font-semibold text-indigo-700"
              onClick={async () => {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(apiUrl('/api/profile/resume'), {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                  toast.push('Could not download resume', 'error');
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener');
              }}
            >
              View current resume
            </button>
          )}
          <p className="mt-2 text-xs text-slate-400">PDF, DOC, or DOCX. Max 5 MB.</p>
        </Card>
      </div>
    </div>
  );
}
