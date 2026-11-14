import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { TextArea } from '../components/ui/Input.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api(`/api/jobs/${id}`),
  });

  const apply = useMutation({
    mutationFn: () => api(`/api/jobs/${id}/apply`, { method: 'POST', body: { coverNote } }),
    onSuccess: () => {
      toast.push('Application submitted');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['job', id] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err) => {
      if (err.code === 'INCOMPLETE_PROFILE' || err.status === 422) {
        setFormError('Your profile needs a name, phone, and resume.');
      } else {
        setFormError(err.message);
      }
    },
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-rose-600">This job is not available.</p>;
  const job = data.job;

  function onApplyClick() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/jobs/${id}` } } });
      return;
    }
    setFormError('');
    setOpen(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <p className="text-sm text-slate-500">{job.company}</p>
        <h1 className="mt-1 text-3xl font-bold">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{job.jobType}</Badge>
          <Badge tone={job.workMode}>{job.workMode}</Badge>
          <Badge>{job.experienceLevel}</Badge>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-slate-700">{job.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(job.skills || []).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">{job.location}</p>
        <p className="mt-2 font-semibold">
          {job.salaryMin || job.salaryMax
            ? `₹${(job.salaryMin || 0).toLocaleString('en-IN')} – ₹${(job.salaryMax || 0).toLocaleString('en-IN')}`
            : 'Salary not listed'}
        </p>
        <Button className="mt-6 w-full" disabled={job.hasApplied} onClick={onApplyClick}>
          {job.hasApplied ? 'Applied' : 'Apply'}
        </Button>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="apply-title" className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="apply-title" className="text-xl font-semibold">
              Apply to {job.title}
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                apply.mutate();
              }}
            >
              <TextArea
                label="Cover note (optional)"
                rows={5}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
              />
              {formError && (
                <p className="text-sm text-rose-600" role="alert">
                  {formError}{' '}
                  {formError.includes('profile') && (
                    <Link className="font-semibold underline" to="/profile">
                      Complete profile
                    </Link>
                  )}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={apply.isPending}>
                  Submit application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
