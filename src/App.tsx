/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateFilterProvider } from './context/DateFilterContext';
import { FinanceDataProvider } from './context/FinanceDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { TransactionModal } from './components/transactions/TransactionModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AccountsView } from './components/accounts/AccountsView';
import { CardsView } from './components/cards/CardsView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { RecurringView } from './components/recurring/RecurringView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { GoalsView } from './components/goals/GoalsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginPage } from './components/auth/LoginPage';
import { NavTab } from './types';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden mb-3 animate-pulse">
          <img src="/assets/finance-app-logo.svg" alt="Finance App" className="w-full h-full object-cover" />
        </div>
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Carregando Finanças...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <DateFilterProvider>
      <FinanceDataProvider>
        <div className="min-h-screen bg-slate-50 flex text-slate-900 selection:bg-emerald-500 selection:text-white">
          {/* Desktop Fixed Sidebar & Mobile/Tablet Drawer */}
          <Sidebar
            currentTab={activeTab}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            setActiveTab={setActiveTab}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Layout Area */}
          <div className="flex-1 flex flex-col xl:pl-64 min-w-0 pb-24 xl:pb-8">
            {/* Header with Month Selector & Quick Action Buttons */}
            <Header
              activeTab={activeTab}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />

            {/* Page View Body */}
            <main className="flex-1 px-3 sm:px-6 xl:px-8 py-4 sm:py-6 max-w-7xl w-full mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardView onNavigateToTransactions={() => setActiveTab('transactions')} />
              )}
              {activeTab === 'transactions' && <TransactionsView />}
              {activeTab === 'accounts' && <AccountsView />}
              {activeTab === 'cards' && (
                <CardsView onNavigateToInvoices={() => setActiveTab('invoices')} />
              )}
              {activeTab === 'invoices' && <InvoicesView />}
              {activeTab === 'recurring' && <RecurringView />}
              {activeTab === 'budgets' && <BudgetsView />}
              {activeTab === 'goals' && <GoalsView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'settings' && <SettingsView />}
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileNav
            currentTab={activeTab}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            setActiveTab={setActiveTab}
            onOpenMoreMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Global New Transaction Modal */}
          <TransactionModal />
        </div>
      </FinanceDataProvider>
    </DateFilterProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
