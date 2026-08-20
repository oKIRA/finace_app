import React from 'react';
import { MetricCardsGrid } from './MetricCardsGrid';
import { SmartInsightsCard } from './SmartInsightsCard';
import { ExpenseCategoryChart } from './ExpenseCategoryChart';
import { IncomeVsExpenseChart } from './IncomeVsExpenseChart';
import { RecentTransactions } from './RecentTransactions';
import { UpcomingBills } from './UpcomingBills';

interface DashboardViewProps {
  onNavigateToTransactions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTransactions }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Main 5 KPI Metric Cards */}
      <MetricCardsGrid />

      {/* 2. Smart Insights / Month Summary */}
      <SmartInsightsCard />

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ExpenseCategoryChart />
        </div>
        <div className="lg:col-span-7">
          <IncomeVsExpenseChart />
        </div>
      </div>

      {/* 4. Recent Transactions & Upcoming Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions onNavigateToTransactions={onNavigateToTransactions} />
        <UpcomingBills />
      </div>
    </div>
  );
};
