export default function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <div className="mt-1 h-6 w-24 animate-pulse rounded bg-gray-100" />
          ) : (
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
