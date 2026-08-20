import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  FileBarChart2,
  Menu,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface MobileNavProps {
  currentTab?: NavItemKey;
  activeTab?: NavItemKey;
  onSelectTab?: (tab: NavItemKey) => void;
  setActiveTab?: (tab: NavItemKey) => void;
  onOpenMoreMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  setActiveTab,
  onOpenMoreMenu,
}) => {
  const selectedTab = currentTab || activeTab || 'dashboard';

  const handleTabClick = (key: NavItemKey) => {
    if (onSelectTab) onSelectTab(key);
    if (setActiveTab) setActiveTab(key);
  };

  const primaryItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { key: 'transactions', label: 'Extrato', icon: ArrowLeftRight },
    { key: 'cards', label: 'Cartões', icon: CreditCard },
    { key: 'reports', label: 'Relatórios', icon: FileBarChart2 },
  ];

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around z-40 shadow-2xl safe-area-pb" aria-label="Navegação rápida">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const isActive = selectedTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            id={`mobile-nav-${item.key}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-400 font-bold bg-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-105' : ''}`} />
            <span className="text-[10px] tracking-tight whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}

      {/* "Mais" Button to trigger drawer with full options (Accounts, Budgets, Goals, Invoices, Recurring, Settings) */}
      <button
        onClick={onOpenMoreMenu}
        id="mobile-nav-more"
        aria-label="Abrir mais opções"
        className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all active:scale-95"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] tracking-tight whitespace-nowrap">Mais</span>
      </button>
    </div>
  );
};
