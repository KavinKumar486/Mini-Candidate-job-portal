export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block text-sm" htmlFor={inputId}>
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextArea({ label, error, id, className = '', ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block text-sm" htmlFor={inputId}>
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <textarea
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 ${
          error ? 'border-rose-400' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function Select({ label, error, id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block text-sm" htmlFor={inputId}>
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <select
        id={inputId}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ${
          error ? 'border-rose-400' : ''
        }`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
