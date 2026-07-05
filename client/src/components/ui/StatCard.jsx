export default function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-clay-50">
          <Icon className="h-5 w-5 text-clay-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-stone-500">{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded bg-stone-100" />
          ) : (
            <p className="font-serif text-xl font-medium text-stone-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
