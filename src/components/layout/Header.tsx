import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  RotateCw,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { useFinanceData } from '../../context/FinanceDataContext';
import { MONTH_NAMES_BR } from '../../lib/utils/dates';
import { NavTab } from '../../types';

interface HeaderProps {
  activeTab?: NavTab;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const { selectedYear, selectedMonth, prevMonth, nextMonth, setMonth, setYear } = useDateFilter();
  const { openTransactionModal, refreshData, loading } = useFinanceData();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  // Close month picker when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-3 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      {/* Left: User Greeting & Mobile Menu Trigger */}
      <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            id="btn-mobile-menu"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden active:scale-95 transition-all shrink-0"
            title="Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span>Olá,</span> <span className="text-emerald-700 font-extrabold truncate">{userName}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              {MONTH_NAMES_BR[selectedMonth - 1]} de {selectedYear}
            </p>
          </div>
        </div>

        {/* Mobile quick add button */}
        <button
          onClick={() => openTransactionModal('expense')}
          id="btn-mobile-quick-add"
          className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
          title="Nova Transação"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar</span>
        </button>
      </div>

      {/* Right: Date Navigation & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        {/* Month Selector Bar */}
        <div
          ref={pickerRef}
          className="relative flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-0.5 sm:p-1 shadow-2xs flex-1 sm:flex-initial justify-between sm:justify-start"
        >
          <button
            onClick={prevMonth}
            id="btn-prev-month"
            title="Mês Anterior"
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            id="btn-month-picker-toggle"
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-slate-800 hover:text-emerald-700 flex items-center gap-1.5 transition-colors truncate"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {MONTH_NAMES_BR[selectedMonth - 1].slice(0, 3)} {selectedYear}
            </span>
          </button>

          <button
            onClick={nextMonth}
            id="btn-next-month"
            title="Próximo Mês"
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-2xs transition-all shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Month & Year Picker Dropdown */}
          {isMonthPickerOpen && (
            <div className="absolute right-0 sm:right-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-100 max-w-[90vw]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Selecionar Período
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setYear(Number(e.target.value))}
                  id="select-year-picker"
                  className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-emerald-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_NAMES_BR.map((mName, idx) => {
                  const mNum = idx + 1;
                  const isCurrent = mNum === selectedMonth;
                  return (
                    <button
                      key={mNum}
                      onClick={() => {
                        setMonth(mNum);
                        setIsMonthPickerOpen(false);
                      }}
                      id={`picker-month-${mNum}`}
                      className={`text-xs py-2 px-1 rounded-lg font-medium transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {mName.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refreshData()}
          disabled={loading}
          id="btn-refresh-data"
          title="Atualizar Dados"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 transition-all disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* Desktop & Tablet "+ Adicionar" Button */}
        <button
          onClick={() => openTransactionModal('expense')}
          id="btn-header-add-transaction"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adicionar</span>
        </button>
      </div>
    </header>
  );
};
