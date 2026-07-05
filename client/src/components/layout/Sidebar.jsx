import { NavLink } from 'react-router-dom';
import {
  Landmark,
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  HandCoins,
  ShieldCheck,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/accounts', label: 'Accounts', icon: CreditCard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/loans', label: 'Loans', icon: HandCoins },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-stone-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 border-r border-stone-200 bg-[#F6F4ED] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay-600">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-serif text-base font-medium text-stone-900">BankDB</p>
            <p className="text-xs text-stone-500">Management system</p>
          </div>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-clay-100 text-clay-800'
                    : 'text-stone-500 hover:bg-[#EDEAE0] hover:text-stone-800'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
