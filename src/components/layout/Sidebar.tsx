import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Receipt,
  Repeat,
  PieChart,
  Target,
  FileBarChart2,
  Settings,
  LogOut,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItemKey =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'cards'
  | 'invoices'
  | 'recurring'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab?: NavItemKey;
  activeTab?: NavItemKey;
  onSelectTab?: (tab: NavItemKey) => void;
  setActiveTab?: (tab: NavItemKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  setActiveTab,
}) => {
  const { user, signOut } = useAuth();
  const selectedTab = currentTab || activeTab || 'dashboard';

  const handleTabClick = (key: NavItemKey) => {
    if (onSelectTab) onSelectTab(key);
    if (setActiveTab) setActiveTab(key);
  };

  const navItems: Array<{ key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'transactions', label: 'Transações', icon: ArrowLeftRight },
    { key: 'accounts', label: 'Contas Bancárias', icon: Landmark },
    { key: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
    { key: 'invoices', label: 'Faturas', icon: Receipt },
    { key: 'recurring', label: 'Recorrentes', icon: Repeat },
    { key: 'budgets', label: 'Orçamento', icon: PieChart },
    { key: 'goals', label: 'Metas', icon: Target },
    { key: 'reports', label: 'Relatórios', icon: FileBarChart2 },
    { key: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold shadow-inner">
          <Wallet className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
            Finance App
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Pro
            </span>
          </h1>
          <p className="text-xs text-slate-400">Controle Pessoal</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              id={`nav-item-${item.key}`}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Sessão Ativa'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            id="btn-logout"
            title="Encerrar Sessão"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
