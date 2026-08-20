import React from 'react';
import { Sparkles, Info, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';

export const SmartInsightsCard: React.FC = () => {
  const { smartInsights } = useFinanceData();

  if (!smartInsights || smartInsights.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-700/60">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-slate-100">Resumo Inteligente do Mês</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {smartInsights.map((insight) => {
          let badgeColor = 'bg-slate-800/80 border-slate-700 text-slate-200';
          let icon = <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;

          if (insight.type === 'warning' || insight.type === 'alert') {
            badgeColor = 'bg-amber-950/40 border-amber-800/50 text-amber-200';
            icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
          } else if (insight.type === 'success') {
            badgeColor = 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200';
            icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={insight.id}
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 backdrop-blur-xs ${badgeColor}`}
            >
              {icon}
              <span className="leading-relaxed">{insight.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
