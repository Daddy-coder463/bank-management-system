const colors = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  DEPOSIT: 'bg-emerald-50 text-emerald-700',
  TRANSFER_IN: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FROZEN: 'bg-sky-50 text-sky-700',
  WITHDRAWAL: 'bg-red-50 text-red-700',
  TRANSFER_OUT: 'bg-red-50 text-red-700',
  REJECTED: 'bg-red-50 text-red-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

export default function Badge({ value }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[value] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {String(value).replace('_', ' ')}
    </span>
  );
}
