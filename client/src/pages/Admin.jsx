import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, X } from 'lucide-react';
import { api, formatCurrency, formatDateTime } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Button from '../components/ui/Button.jsx';

export default function Admin() {
  const { toast } = useToast();
  const [branches, setBranches] = useState([]);
  const [pending, setPending] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      Promise.all([
        api('/admin/branch-summary'),
        api('/admin/pending-loans'),
        api('/admin/audit-logs'),
      ])
        .then(([b, p, l]) => {
          setBranches(b.branches);
          setPending(p.loans);
          setLogs(l.logs);
        })
        .catch((err) => toast(err.message, 'error'))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function decide(loan, decision) {
    try {
      await api(`/admin/loans/${loan.id}/decision`, { method: 'POST', body: { decision } });
      toast(`Loan ${decision.toLowerCase()}`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-[28px] font-medium text-stone-900">Admin</h1>
        <p className="text-sm text-stone-500">Branch performance, approvals and audit trail</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(loading ? [...Array(3)] : branches).map((b, i) => (
          <div key={b?.id ?? i} className="rounded-xl border border-stone-200 bg-white p-6">
            {b ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clay-50">
                    <Building2 className="h-5 w-5 text-clay-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{b.name}</p>
                    <p className="text-xs text-stone-400">{b.code}</p>
                  </div>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-stone-500">Deposits</dt><dd className="font-medium text-stone-900">{formatCurrency(b.total_deposits)}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Accounts</dt><dd className="font-medium text-stone-900">{b.total_accounts}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Customers</dt><dd className="font-medium text-stone-900">{b.total_customers}</dd></div>
                  <div className="flex justify-between"><dt className="text-stone-500">Active loans</dt><dd className="font-medium text-stone-900">{b.active_loans}</dd></div>
                </dl>
              </>
            ) : (
              <div className="h-36 animate-pulse rounded-lg bg-stone-100" />
            )}
          </div>
        ))}
      </div>

      <Card title="Loan approval queue">
        <Table
          loading={loading}
          rows={pending}
          emptyMessage="No loans waiting for approval"
          columns={[
            { key: 'customer_name', label: 'Customer', render: (r) => <span className="font-medium text-stone-900">{r.customer_name}</span> },
            { key: 'type', label: 'Type' },
            { key: 'principal', label: 'Principal', align: 'right', render: (r) => formatCurrency(r.principal) },
            { key: 'interest_rate', label: 'Rate', align: 'right', render: (r) => `${r.interest_rate}%` },
            { key: 'tenure_months', label: 'Tenure', align: 'right', render: (r) => `${r.tenure_months} mo` },
            { key: 'emi', label: 'EMI', align: 'right', render: (r) => formatCurrency(r.emi) },
            {
              key: 'actions',
              label: '',
              align: 'right',
              render: (r) => (
                <div className="flex justify-end gap-2">
                  <Button className="!px-3 !py-1.5 text-xs" onClick={() => decide(r, 'APPROVED')}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => decide(r, 'REJECTED')}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Audit logs (written by database triggers)">
        <Table
          loading={loading}
          rows={logs}
          emptyMessage="No audit entries yet"
          columns={[
            { key: 'changed_at', label: 'When', render: (r) => formatDateTime(r.changed_at) },
            { key: 'table_name', label: 'Table' },
            { key: 'action', label: 'Action' },
            { key: 'record_id', label: 'Record' },
            {
              key: 'old_value',
              label: 'Old → New',
              render: (r) => (
                <span className="font-mono text-xs text-stone-500">
                  {JSON.stringify(r.old_value)} → {JSON.stringify(r.new_value)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
