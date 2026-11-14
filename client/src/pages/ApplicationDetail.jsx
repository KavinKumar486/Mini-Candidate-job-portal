import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const TERMINAL = new Set(['HIRED', 'REJECTED', 'WITHDRAWN']);

export function ApplicationDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api(`/api/applications/${id}`),
  });

  const withdraw = useMutation({
    mutationFn: () => api(`/api/applications/${id}/withdraw`, { method: 'POST' }),
    onSuccess: () => {
      toast.push('Application withdrawn');
      setConfirm(false);
      qc.invalidateQueries({ queryKey: ['application', id] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (err) => toast.push(err.message, 'error'),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-rose-600">Application not found.</p>;
  const app = data.application;
  const canWithdraw = !TERMINAL.has(app.status);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/applications')}>
        ← Back
      </Button>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{app.job?.title}</h1>
            <p className="text-slate-500">{app.job?.company}</p>
          </div>
          <Badge>{app.status}</Badge>
        </div>
        {app.coverNote && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{app.coverNote}</p>}
        <Button className="mt-6" variant="danger" disabled={!canWithdraw} onClick={() => setConfirm(true)}>
          Withdraw
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold">Status timeline</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-indigo-100 pl-4">
          {(app.history || []).map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-indigo-500" />
              <p className="font-medium">
                {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
              </p>
              <p className="text-xs text-slate-400">{new Date(h.changedAt).toLocaleString()}</p>
              {h.note && <p className="text-sm text-slate-600">{h.note}</p>}
            </li>
          ))}
        </ol>
      </Card>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setConfirm(false)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Withdraw this application?</h2>
            <p className="mt-2 text-sm text-slate-500">This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
                Confirm withdraw
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
