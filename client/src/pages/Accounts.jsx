import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, PlusCircle } from 'lucide-react';
import { api, formatCurrency, formatDate } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Input, Select } from '../components/ui/Input.jsx';

const emptyForm = { customer_id: '', branch_id: '', type: 'SAVINGS', initial_deposit: '' };

export default function Accounts() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(searchParams.get('action') === 'new');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (query = '') =>
      api(`/accounts?search=${encodeURIComponent(query)}`)
        .then((d) => setAccounts(d.accounts))
        .catch((err) => toast(err.message, 'error'))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => {
    Promise.all([api('/customers'), api('/accounts/branches')])
      .then(([c, b]) => {
        setCustomers(c.customers);
        setBranches(b.branches);
      })
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get('action')) setSearchParams({});
  }

  async function save() {
    const next = {};
    if (!form.customer_id) next.customer_id = 'Select a customer';
    if (!form.branch_id) next.branch_id = 'Select a branch';
    if (form.initial_deposit && Number(form.initial_deposit) < 0)
      next.initial_deposit = 'Deposit cannot be negative';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const data = await api('/accounts', {
        method: 'POST',
        body: { ...form, initial_deposit: Number(form.initial_deposit) || 0 },
      });
      toast(`Account ${data.account_no} opened`);
      setForm(emptyForm);
      closeModal();
      load(search);
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
          <h1 className="font-serif text-[28px] font-medium text-stone-900">Accounts</h1>
          <p className="text-sm text-stone-500">All bank accounts and balances</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusCircle className="h-4 w-4" /> Open new account
        </Button>
      </div>

      <Card>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-3.5 text-sm placeholder:text-stone-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-100"
            placeholder="Search by account no. or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          loading={loading}
          rows={accounts}
          emptyMessage="No accounts found"
          columns={[
            { key: 'account_no', label: 'Account no.', render: (r) => <span className="font-mono text-stone-900">{r.account_no}</span> },
            { key: 'customer_name', label: 'Customer' },
            { key: 'branch_name', label: 'Branch' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            { key: 'opened_at', label: 'Opened', render: (r) => formatDate(r.opened_at) },
            {
              key: 'balance',
              label: 'Balance',
              align: 'right',
              render: (r) => <span className="font-medium text-stone-900">{formatCurrency(r.balance)}</span>,
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Open new account"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Opening…' : 'Open account'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Customer" value={form.customer_id} error={errors.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </Select>
          <Select label="Branch" value={form.branch_id} error={errors.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
            <option value="">Select branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.code} — {b.name}</option>
            ))}
          </Select>
          <Select label="Account type" value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
            <option value="FD">Fixed Deposit</option>
          </Select>
          <Input label="Initial deposit (optional)" type="number" min="0" placeholder="0.00"
            value={form.initial_deposit} error={errors.initial_deposit}
            onChange={(e) => setForm({ ...form, initial_deposit: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
