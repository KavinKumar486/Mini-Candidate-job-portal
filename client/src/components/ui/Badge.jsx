const COLORS = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-sky-100 text-sky-800',
  SHORTLISTED: 'bg-violet-100 text-violet-800',
  INTERVIEW: 'bg-amber-100 text-amber-900',
  OFFERED: 'bg-emerald-100 text-emerald-800',
  HIRED: 'bg-green-200 text-green-900',
  REJECTED: 'bg-rose-100 text-rose-800',
  WITHDRAWN: 'bg-slate-200 text-slate-600',
  OPEN: 'bg-indigo-100 text-indigo-800',
  REMOTE: 'bg-teal-100 text-teal-800',
  HYBRID: 'bg-cyan-100 text-cyan-800',
  ONSITE: 'bg-orange-100 text-orange-800',
  Applied: 'bg-indigo-600 text-white',
};

export function Badge({ children, tone }) {
  const key = tone || children;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[key] || 'bg-slate-100 text-slate-700'}`}>
      {String(children).replaceAll('_', ' ')}
    </span>
  );
}
