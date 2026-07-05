import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-[#FAF9F5]/90 px-6 py-3.5 backdrop-blur">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-100 text-sm font-medium text-clay-700">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-stone-900">{user?.name}</p>
            <p className="text-xs text-stone-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
