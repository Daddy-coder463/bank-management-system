import { useCallback, useEffect, useMemo, useState } from 'react';
import { HandCoins, IndianRupee } from 'lucide-react';
import { api, formatCurrency } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Input, Select } from '../components/ui/Input.jsx';

// Mirrors the reducing-balance EMI formula used by the server.
function calculateEmi(principal, annualRate, tenureMonths) {
  const r = annualRate / 100 / 12;
  if (!principal || !tenureMonths) return 0;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

const emptyForm = { customer_id: '', branch_id: '', type: 'PERSONAL', principal: '', interest_rate: '', tenure_months: '' };

export default function Loans() {
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [paying, setPaying] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      api('/loans')
        .then((d) => setLoans(d.loans))
        .catch((err) => toast(err.message, 'error'))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    load();
    Promise.all([api('/customers'), api('/accounts/branches')])
      .then(([c, b]) => {
        setCustomers(c.customers);
        setBranches(b.branches);
      })
      .catch((err) => toast(err.message, 'error'));
  }, [load, toast]);

  const previewEmi = useMemo(
    () => calculateEmi(Number(form.principal), Number(form.interest_rate), Number(form.tenure_months)),
    [form.principal, form.interest_rate, form.tenure_months]
  );

  async function apply() {
    const next = {};
    if (!form.customer_id) next.customer_id = 'Select a customer';
    if (!form.branch_id) next.branch_id = 'Select a branch';
    if (!Number(form.principal) || Number(form.principal) <= 0) next.principal = 'Enter a positive amount';
    if (!Number(form.interest_rate) || Number(form.interest_rate) <= 0) next.interest_rate = 'Enter a positive rate';
    if (!Number(form.tenure_months) || Number(form.tenure_months) <= 0) next.tenure_months = 'Enter tenure in months';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await api('/loans', { method: 'POST', body: form });
      toast('Loan application submitted (pending approval)');
      setApplyOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function pay() {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return toast('Enter a positive payment amount', 'error');
    setSaving(true);
    try {
      await api(`/loans/${paying.id}/pay`, { method: 'POST', body: { amount: amt } });
      toast('Payment recorded');
      setPaying(null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500">Loan applications, EMIs and repayments</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setErrors({}); setApplyOpen(true); }}>
          <HandCoins className="h-4 w-4" /> Apply for Loan
        </Button>
      </div>

      <Card>
        <Table
          loading={loading}
          rows={loans}
          emptyMessage="No loans yet"
          columns={[
            { key: 'customer_name', label: 'Customer', render: (r) => <span className="font-medium text-gray-900">{r.customer_name}</span> },
            { key: 'type', label: 'Type' },
            { key: 'principal', label: 'Principal', align: 'right', render: (r) => formatCurrency(r.principal) },
            { key: 'interest_rate', label: 'Rate', align: 'right', render: (r) => `${r.interest_rate}%` },
            { key: 'emi', label: 'EMI', align: 'right', render: (r) => formatCurrency(r.emi) },
            {
              key: 'progress',
              label: 'Repaid',
              render: (r) => {
                const pct = r.total_payable > 0 ? Math.min(100, Math.round((r.total_paid / r.total_payable) * 100)) : 0;
                return (
                  <div className="w-28">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              },
            },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (r) =>
                r.status === 'APPROVED' ? (
                  <Button variant="secondary" className="!px-3 !py-1.5 text-xs"
                    onClick={() => { setPaying(r); setPayAmount(String(r.emi)); }}>
                    <IndianRupee className="h-3.5 w-3.5" /> Pay EMI
                  </Button>
                ) : null,
            },
          ]}
        />
      </Card>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply for Loan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={apply} disabled={saving}>{saving ? 'Submitting…' : 'Submit Application'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Customer" value={form.customer_id} error={errors.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
            <option value="">Select customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Branch" value={form.branch_id} error={errors.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
              <option value="">Select…</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}
            </Select>
            <Select label="Loan type" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PERSONAL">Personal</option>
              <option value="HOME">Home</option>
              <option value="AUTO">Auto</option>
              <option value="EDUCATION">Education</option>
            </Select>
          </div>
          <Input label="Principal amount" type="number" min="0" value={form.principal} error={errors.principal}
            onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interest rate (% p.a.)" type="number" min="0" step="0.01"
              value={form.interest_rate} error={errors.interest_rate}
              onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
            <Input label="Tenure (months)" type="number" min="1"
              value={form.tenure_months} error={errors.tenure_months}
              onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} />
          </div>
          {previewEmi > 0 && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Estimated EMI: <span className="font-semibold">{formatCurrency(previewEmi)}</span> / month
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title="Pay EMI"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaying(null)}>Cancel</Button>
            <Button onClick={pay} disabled={saving}>{saving ? 'Paying…' : 'Record Payment'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {paying?.customer_name} — {paying?.type} loan. Outstanding:{' '}
            <span className="font-medium text-gray-900">{formatCurrency(paying?.outstanding)}</span>
          </p>
          <Input label="Payment amount" type="number" min="0" value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
