import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  ArrowLeftRight,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { transactionsService } from '../../services/transactionsService';
import { exportService } from '../../services/exportService';
import { formatCurrency } from '../../lib/utils/formatters';
import { formatDateBR } from '../../lib/utils/dates';
import { DynamicIcon } from '../ui/DynamicIcon';
import { Transaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const { user } = useAuth();
  const {
    transactions,
    categories,
    accounts,
    cards,
    openTransactionModal,
    refreshData,
  } = useFinanceData();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c.name])), [cards]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          (t.notes && t.notes.toLowerCase().includes(term))
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    if (accountFilter !== 'all') {
      result = result.filter(
        (t) => t.accountId === accountFilter || t.targetAccountId === accountFilter || t.cardId === accountFilter
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, categoryFilter, accountFilter, sortBy]);

  const handleDelete = async (t: Transaction) => {
    if (!user) return;
    if (window.confirm(`Deseja realmente excluir o lançamento "${t.description}"?`)) {
      try {
        await transactionsService.deleteTransaction(user.uid, t);
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir transação.');
      }
    }
  };

  const handleExportCSV = () => {
    exportService.exportTransactionsToCSV(filteredTransactions, accounts, categories);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Extrato de Transações</h2>
          <p className="text-xs text-slate-400">
            {filteredTransactions.length} lançamentos encontrados neste período
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            id="btn-export-transactions-csv"
            title="Exportar dados filtrados para CSV"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Exportar CSV
          </button>

          <button
            onClick={() => openTransactionModal('expense')}
            id="btn-add-transaction-view"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Nova Transação
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por descrição..."
              id="input-search-transactions"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              id="select-filter-type"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas (+)</option>
              <option value="expense">Despesas (-)</option>
              <option value="card_expense">Cartão de Crédito</option>
              <option value="transfer">Transferências</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="select-filter-category"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              id="select-sort-transactions"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="date_desc">Data (Recentes)</option>
              <option value="date_asc">Data (Antigos)</option>
              <option value="amount_desc">Maior Valor</option>
              <option value="amount_asc">Menor Valor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Você ainda não possui transações neste filtro</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Comece adicionando sua primeira receita, despesa ou compra no cartão.
            </p>
            <button
              onClick={() => openTransactionModal('expense')}
              id="btn-empty-table-add"
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Transação
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Conta / Cartão</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => {
                  const cat = catMap.get(t.categoryId);
                  const isIncome = t.type === 'income';
                  const isCard = t.type === 'card_expense';
                  const isTransfer = t.type === 'transfer';
                  const isPayment = t.type === 'card_payment';

                  const sourceName = t.cardId
                    ? cardMap.get(t.cardId) || 'Cartão'
                    : accMap.get(t.accountId) || 'Conta';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDateBR(t.date)}
                      </td>

                      {/* Description & Installments */}
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{t.description}</span>
                          {t.isInstallment && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-black border border-purple-200">
                              {t.currentInstallment}/{t.totalInstallments}
                            </span>
                          )}
                        </div>
                        {t.notes && (
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">{t.notes}</p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {cat ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                          </div>
                        ) : isTransfer ? (
                          <span className="text-blue-600 font-medium">Transferência</span>
                        ) : (
                          <span className="text-slate-400">Geral</span>
                        )}
                      </td>

                      {/* Account or Card */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {isTransfer ? (
                          <span>
                            {accMap.get(t.accountId)} → {accMap.get(t.targetAccountId || '')}
                          </span>
                        ) : (
                          <span>{sourceName}</span>
                        )}
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                          {t.paymentMethod || (isCard ? 'Crédito' : 'Débito')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        className={`py-3 px-4 text-right font-black whitespace-nowrap ${
                          isIncome
                            ? 'text-emerald-600'
                            : isTransfer
                            ? 'text-blue-600'
                            : isCard
                            ? 'text-purple-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+ ' : '- '}
                        {formatCurrency(t.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(t)}
                          id={`btn-delete-trans-${t.id}`}
                          title="Excluir Transação"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
