export default function Card({ title, action, className = '', children }) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-sm font-medium text-stone-900">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
