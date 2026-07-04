import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { api, formatDate } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Input } from '../components/ui/Input.jsx';

const emptyForm = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(searchParams.get('action') === 'new' ? 'new' : null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (query = '') =>
      api(`/customers?search=${encodeURIComponent(query)}`)
        .then((d) => setCustomers(d.customers))
        .catch((err) => toast(err.message, 'error'))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  function openNew() {
    setForm(emptyForm);
    setErrors({});
    setEditing(null);
    setModal('new');
  }

  function openEdit(customer) {
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setErrors({});
    setEditing(customer);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    if (searchParams.get('action')) setSearchParams({});
  }

  async function save() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'A valid email is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (editing) {
        await api(`/customers/${editing.id}`, { method: 'PUT', body: form });
        toast('Customer updated');
      } else {
        await api('/customers', { method: 'POST', body: form });
        toast('Customer created');
      }
      closeModal();
      load(search);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await api(`/customers/${deleting.id}`, { method: 'DELETE' });
      toast('Customer deleted');
      setDeleting(null);
      load(search);
    } catch (err) {
      // FK RESTRICT: customers with accounts/loans cannot be deleted
      toast(err.message, 'error');
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Manage bank customers</p>
        </div>
        <Button onClick={openNew}>
          <UserPlus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          loading={loading}
          rows={customers}
          emptyMessage="No customers found"
          columns={[
            { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
            { key: 'account_count', label: 'Accounts' },
            { key: 'created_at', label: 'Joined', render: (r) => formatDate(r.created_at) },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (r) => (
                <div className="flex justify-end gap-1">
                  <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" value={form.name} error={errors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Customer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Delete <span className="font-medium text-gray-900">{deleting?.name}</span>? Customers with
          existing accounts or loans cannot be deleted (foreign key protection).
        </p>
      </Modal>
    </div>
  );
}
