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
  Wallet,
  X,
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
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  setActiveTab,
  isOpen = false,
  onClose,
}) => {
  const { user, signOut } = useAuth();
  const selectedTab = currentTab || activeTab || 'dashboard';

  const handleTabClick = (key: NavItemKey) => {
    if (onSelectTab) onSelectTab(key);
    if (setActiveTab) setActiveTab(key);
    if (onClose) onClose();
  };

  const navItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold shadow-inner shrink-0">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-1.5 truncate">
              Finance App
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Pro
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">Controle Pessoal</p>
          </div>
        </div>

        {/* Close Button for Mobile/Tablet Drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 sm:py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              id={`nav-item-${item.key}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 text-left ${
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
      <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {user?.displayName
                ? user.displayName.charAt(0).toUpperCase()
                : user?.email
                ? user.email.charAt(0).toUpperCase()
                : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Sessão Ativa'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            id="btn-logout"
            title="Encerrar Sessão"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Permanent Desktop Sidebar (lg: screens and above) */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* 2. Mobile & Tablet Slide-Over Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
