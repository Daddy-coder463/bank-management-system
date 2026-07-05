import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import { api, formatCurrency, formatDateTime } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Input, Select } from '../components/ui/Input.jsx';

export default function Transactions() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ account_no: '', type: '', from: '', to: '' });
  // modal: null | 'deposit' | 'withdraw' | 'transfer'
  const [modal, setModal] = useState(searchParams.get('action') === 'transfer' ? 'transfer' : null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    ).toString();
    return api(`/transactions${qs ? `?${qs}` : ''}`)
      .then((d) => setTransactions(d.transactions))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [filters, toast]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function openModal(kind) {
    setForm({});
    setErrors({});
    setModal(kind);
  }

  function closeModal() {
    setModal(null);
    if (searchParams.get('action')) setSearchParams({});
  }

  async function submit() {
    const next = {};
    const amt = Number(form.amount);
    if (modal === 'transfer') {
      if (!form.from_account_no) next.from_account_no = 'Required';
      if (!form.to_account_no) next.to_account_no = 'Required';
      if (form.from_account_no && form.from_account_no === form.to_account_no)
        next.to_account_no = 'Must differ from source account';
    } else if (!form.account_no) {
      next.account_no = 'Required';
    }
    if (!amt || amt <= 0) next.amount = 'Enter a positive amount';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (modal === 'transfer') {
        const data = await api('/transactions/transfer', { method: 'POST', body: form });
        toast(`Transfer complete. Ref: ${data.reference_id?.slice(0, 8)}…`);
      } else {
        await api(`/transactions/${modal}`, { method: 'POST', body: form });
        toast(modal === 'deposit' ? 'Deposit recorded' : 'Withdrawal recorded');
      }
      closeModal();
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-stone-900">Transactions</h1>
          <p className="text-sm text-stone-500">Deposits, withdrawals and transfers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => openModal('deposit')}>
            <ArrowDownToLine className="h-4 w-4" /> Deposit
          </Button>
          <Button variant="secondary" onClick={() => openModal('withdraw')}>
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw
          </Button>
          <Button onClick={() => openModal('transfer')}>
            <ArrowLeftRight className="h-4 w-4" /> Transfer money
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Account number" value={filters.account_no}
            onChange={(e) => setFilters({ ...filters, account_no: e.target.value })} />
          <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER_IN">Transfer in</option>
            <option value="TRANSFER_OUT">Transfer out</option>
          </Select>
          <Input type="date" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <Input type="date" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <Table
          loading={loading}
          rows={transactions}
          emptyMessage="No transactions match these filters"
          columns={[
            { key: 'created_at', label: 'Date', render: (r) => formatDateTime(r.created_at) },
            { key: 'account_no', label: 'Account', render: (r) => <span className="font-mono">{r.account_no}</span> },
            { key: 'customer_name', label: 'Customer' },
            { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} /> },
            { key: 'note', label: 'Note', render: (r) => r.note || '—' },
            {
              key: 'amount',
              label: 'Amount',
              align: 'right',
              render: (r) => (
                <span className={r.type === 'DEPOSIT' || r.type === 'TRANSFER_IN' ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}>
                  {r.type === 'DEPOSIT' || r.type === 'TRANSFER_IN' ? '+' : '−'}{formatCurrency(r.amount)}
                </span>
              ),
            },
            {
              key: 'balance_after',
              label: 'Balance after',
              align: 'right',
              render: (r) => formatCurrency(r.balance_after),
            },
          ]}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'deposit' ? 'Deposit money' : modal === 'withdraw' ? 'Withdraw money' : 'Transfer money'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Processing…' : 'Confirm'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {modal === 'transfer' ? (
            <>
              <Input label="From account number" placeholder="100000000001"
                value={form.from_account_no || ''} error={errors.from_account_no}
                onChange={(e) => setForm({ ...form, from_account_no: e.target.value })} />
              <Input label="To account number" placeholder="100000000003"
                value={form.to_account_no || ''} error={errors.to_account_no}
                onChange={(e) => setForm({ ...form, to_account_no: e.target.value })} />
            </>
          ) : (
            <Input label="Account number" placeholder="100000000001"
              value={form.account_no || ''} error={errors.account_no}
              onChange={(e) => setForm({ ...form, account_no: e.target.value })} />
          )}
          <Input label="Amount" type="number" min="0" placeholder="0.00"
            value={form.amount || ''} error={errors.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Note (optional)" placeholder="e.g. Rent payment"
            value={form.note || ''}
            onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
