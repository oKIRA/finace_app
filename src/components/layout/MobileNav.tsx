import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Receipt,
  PieChart,
  Target,
  FileBarChart2,
  Settings,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface MobileNavProps {
  currentTab?: NavItemKey;
  activeTab?: NavItemKey;
  onSelectTab?: (tab: NavItemKey) => void;
  setActiveTab?: (tab: NavItemKey) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  activeTab,
  onSelectTab,
  setActiveTab,
}) => {
  const selectedTab = currentTab || activeTab || 'dashboard';

  const handleTabClick = (key: NavItemKey) => {
    if (onSelectTab) onSelectTab(key);
    if (setActiveTab) setActiveTab(key);
  };

  const primaryItems: Array<{ key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { key: 'transactions', label: 'Extrato', icon: ArrowLeftRight },
    { key: 'cards', label: 'Cartões', icon: CreditCard },
    { key: 'reports', label: 'Relatórios', icon: FileBarChart2 },
    { key: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const isActive = selectedTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => handleTabClick(item.key)}
            id={`mobile-nav-${item.key}`}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
