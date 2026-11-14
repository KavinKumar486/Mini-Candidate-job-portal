import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Select } from '../components/ui/Input.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'];

export function Applications() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = params.get('page') || '1';
  const qs = new URLSearchParams({ page, pageSize: '10' });
  if (status) qs.set('status', status);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications', qs.toString()],
    queryFn: () => api(`/api/applications?${qs.toString()}`),
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-bold">Your applications</h1>
        <Select
          label="Status"
          value={status}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('status', e.target.value);
            else next.delete('status');
            next.set('page', '1');
            setParams(next);
          }}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-6">
        {isLoading && <Spinner />}
        {isError && <EmptyState title="Could not load applications" actionLabel="Retry" onAction={refetch} />}
        {data && data.items.length === 0 && (
          <EmptyState title="No applications yet" body="Find a role and apply." actionLabel="Browse jobs" onAction={() => (window.location.href = '/jobs')} />
        )}
        <div className="grid gap-3">
          {data?.items.map((app) => (
            <Link key={app.id} to={`/applications/${app.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 hover:border-indigo-200">
                <div>
                  <p className="font-semibold">{app.job?.title}</p>
                  <p className="text-sm text-slate-500">{app.job?.company}</p>
                </div>
                <Badge>{app.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              disabled={data.page <= 1}
              onClick={() => setParams({ ...Object.fromEntries(params), page: String(data.page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={data.page >= data.totalPages}
              onClick={() => setParams({ ...Object.fromEntries(params), page: String(data.page + 1) })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
