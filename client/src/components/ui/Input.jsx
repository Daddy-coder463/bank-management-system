const baseClasses =
  'w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-100';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-stone-700">{label}</label>}
      <input className={`${baseClasses} ${error ? 'border-red-300' : ''}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-stone-700">{label}</label>}
      <select className={`${baseClasses} ${error ? 'border-red-300' : ''}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
