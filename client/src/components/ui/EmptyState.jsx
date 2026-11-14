import { Button } from './Button.jsx';

export function EmptyState({ title, body, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-2 text-sm text-slate-500">{body}</p>}
      {actionLabel && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
