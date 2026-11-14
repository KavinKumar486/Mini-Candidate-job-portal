import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';

function formatSalary(min, max) {
  if (!min && !max) return 'Salary not listed';
  const inr = (n) => (n ? `₹${Math.round(n / 100000) / 10} L` : '—');
  return `${inr(min)} – ${inr(max)}`;
}

function postedLabel(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function Jobs() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const qInput = params.get('q') || '';
  const debouncedQ = useDebouncedValue(qInput, 400);

  const query = useMemo(() => {
    const next = new URLSearchParams(params);
    if (debouncedQ) next.set('q', debouncedQ);
    else next.delete('q');
    if (!next.get('page')) next.set('page', '1');
    if (!next.get('pageSize')) next.set('pageSize', '10');
    return next;
  }, [params, debouncedQ]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['jobs', query.toString()],
    queryFn: () => api(`/api/jobs?${query.toString()}`),
  });

  function setField(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  }

  function clearFilters() {
    setParams(new URLSearchParams());
  }

  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Input label="Location" value={params.get('location') || ''} onChange={(e) => setField('location', e.target.value)} />
      <Select label="Job type" value={params.get('jobType') || ''} onChange={(e) => setField('jobType', e.target.value)}>
        <option value="">Any</option>
        <option value="FULL_TIME">Full time</option>
        <option value="PART_TIME">Part time</option>
        <option value="CONTRACT">Contract</option>
        <option value="INTERNSHIP">Internship</option>
      </Select>
      <Select label="Work mode" value={params.get('workMode') || ''} onChange={(e) => setField('workMode', e.target.value)}>
        <option value="">Any</option>
        <option value="REMOTE">Remote</option>
        <option value="HYBRID">Hybrid</option>
        <option value="ONSITE">Onsite</option>
      </Select>
      <Input
        label="Experience level"
        placeholder="MID, SENIOR…"
        value={params.get('experienceLevel') || ''}
        onChange={(e) => setField('experienceLevel', e.target.value)}
      />
      <Input
        label="Min salary (INR)"
        type="number"
        value={params.get('salaryMin') || ''}
        onChange={(e) => setField('salaryMin', e.target.value)}
      />
      <Input label="Skills" placeholder="react,sql" value={params.get('skills') || ''} onChange={(e) => setField('skills', e.target.value)} />
      <Select label="Posted within" value={params.get('postedWithin') || ''} onChange={(e) => setField('postedWithin', e.target.value)}>
        <option value="">Any time</option>
        <option value="1">1 day</option>
        <option value="7">7 days</option>
        <option value="30">30 days</option>
      </Select>
      <Select label="Sort" value={params.get('sort') || 'newest'} onChange={(e) => setField('sort', e.target.value)}>
        <option value="newest">Newest</option>
        <option value="salary_desc">Salary high to low</option>
      </Select>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Open roles</h1>
          <p className="text-slate-500">Search, filter, and apply. Filters live in the URL so you can share them.</p>
        </div>
        <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
          Filters
        </Button>
      </div>

      <div className="mt-6">
        <Input
          label="Search"
          placeholder="Title, company, skill…"
          value={qInput}
          onChange={(e) => setField('q', e.target.value)}
        />
      </div>

      <div className="mt-4 hidden lg:block">{filters}</div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-900/40" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <Button variant="ghost" onClick={() => setFiltersOpen(false)}>
                Close
              </Button>
            </div>
            {filters}
            <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {isLoading && (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        )}
        {isError && (
          <EmptyState title="Could not load jobs" body="Check that the API is running." actionLabel="Retry" onAction={refetch} />
        )}
        {data && data.items.length === 0 && (
          <EmptyState title="No jobs match" body="Try clearing filters." actionLabel="Clear filters" onAction={clearFilters} />
        )}
        <div className="grid gap-4">
          {data?.items.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="transition hover:border-indigo-200 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <p className="text-sm text-slate-500">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{job.jobType}</Badge>
                    <Badge tone={job.workMode}>{job.workMode}</Badge>
                    {job.hasApplied && <Badge tone="Applied">Applied</Badge>}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.skills || []).slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">{postedLabel(job.postedAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
        {data && data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              disabled={data.page <= 1}
              onClick={() => setField('page', String(data.page - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-500">
              Page {data.page} of {data.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={data.page >= data.totalPages}
              onClick={() => setField('page', String(data.page + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
