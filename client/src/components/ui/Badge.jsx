const colors = {
  ACTIVE: 'bg-[#EAF3DE] text-[#3B6D11]',
  APPROVED: 'bg-[#EAF3DE] text-[#3B6D11]',
  DEPOSIT: 'bg-[#EAF3DE] text-[#3B6D11]',
  TRANSFER_IN: 'bg-[#EAF3DE] text-[#3B6D11]',
  PENDING: 'bg-[#FAEEDA] text-[#854F0B]',
  FROZEN: 'bg-[#E6F1FB] text-[#185FA5]',
  WITHDRAWAL: 'bg-[#FCEBEB] text-[#A32D2D]',
  TRANSFER_OUT: 'bg-[#FCEBEB] text-[#A32D2D]',
  REJECTED: 'bg-[#FCEBEB] text-[#A32D2D]',
  CLOSED: 'bg-stone-100 text-stone-600',
};

export default function Badge({ value }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        colors[value] || 'bg-stone-100 text-stone-600'
      }`}
    >
      {String(value).replace('_', ' ')}
    </span>
  );
}
