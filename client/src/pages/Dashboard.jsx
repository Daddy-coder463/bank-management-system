import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CreditCard, Banknote, HandCoins, UserPlus, PlusCircle, ArrowLeftRight } from 'lucide-react';
import { api, formatCurrency, formatDateTime } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';

export default function Dashboard() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/dashboard/summary')
      .then(setData)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500">Overview of the bank at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/customers?action=new">
            <Button variant="secondary"><UserPlus className="h-4 w-4" /> Create customer</Button>
          </Link>
          <Link to="/accounts?action=new">
            <Button variant="secondary"><PlusCircle className="h-4 w-4" /> Open account</Button>
          </Link>
          <Link to="/transactions?action=transfer">
            <Button><ArrowLeftRight className="h-4 w-4" /> Transfer money</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total customers" value={summary?.total_customers} loading={loading} />
        <StatCard icon={CreditCard} label="Active accounts" value={summary?.total_accounts} loading={loading} />
        <StatCard icon={Banknote} label="Total deposits" value={formatCurrency(summary?.total_deposits)} loading={loading} />
        <StatCard icon={HandCoins} label="Active loans" value={summary?.active_loans} loading={loading} />
      </div>

      <Card title="Recent transactions">
        <Table
          loading={loading}
          rows={data?.recentTransactions || []}
          emptyMessage="No transactions yet"
          columns={[
            { key: 'created_at', label: 'Date', render: (r) => formatDateTime(r.created_at) },
            { key: 'account_no', label: 'Account' },
            { key: 'customer_name', label: 'Customer' },
            { key: 'type', label: 'Type', render: (r) => <Badge value={r.type} /> },
            {
              key: 'amount',
              label: 'Amount',
              align: 'right',
              render: (r) => (
                <span className={r.type === 'DEPOSIT' || r.type === 'TRANSFER_IN' ? 'text-[#3B6D11]' : 'text-[#A32D2D]'}>
                  {formatCurrency(r.amount)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
