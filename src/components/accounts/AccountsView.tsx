import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  Edit2,
  Wallet,
  Building,
  PiggyBank,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useAuth } from '../../context/AuthContext';
import { accountsService } from '../../services/accountsService';
import { formatCurrency } from '../../lib/utils/formatters';
import { Account, AccountType } from '../../types';

export const AccountsView: React.FC = () => {
  const { user } = useAuth();
  const { accounts, summary, refreshData } = useFinanceData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [color, setColor] = useState('#8A05BE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setBank('');
    setType('checking');
    setInitialBalanceStr('');
    setColor('#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBank(acc.bank || '');
    setType(acc.type);
    setInitialBalanceStr(((acc.initialBalance || 0) / 100).toFixed(2));
    setColor(acc.color || '#8A05BE');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome da conta.');
      return;
    }

    let cleaned = initialBalanceStr.replace(/[R$\s]/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const balanceFloat = parseFloat(cleaned) || 0;
    const balanceCents = Math.round(balanceFloat * 100);

    try {
      setSubmitting(true);
      setErrorMsg(null);
      if (editingAccount) {
        await accountsService.updateAccount(user.uid, editingAccount.id, {
          name: name.trim(),
          bank: bank.trim(),
          type,
          color,
        });
      } else {
        await accountsService.createAccount(user.uid, {
          name: name.trim(),
          bank: bank.trim() || name.trim(),
          type,
          initialBalance: balanceCents,
          currentBalance: balanceCents,
          color,
        });
      }

      await refreshData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao salvar conta: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (acc: Account) => {
    if (!user) return;
    if (window.confirm(`Deseja realmente excluir a conta "${acc.name}"?`)) {
      try {
        await accountsService.deleteAccount(user.uid, acc.id);
        await refreshData();
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir conta.');
      }
    }
  };

  const getTypeLabel = (t: AccountType) => {
    switch (t) {
      case 'checking':
        return 'Conta Corrente';
      case 'savings':
        return 'Poupança';
      case 'cash':
        return 'Dinheiro / Carteira';
      case 'investment':
        return 'Investimentos';
      default:
        return 'Outra';
    }
  };

  const getTypeIcon = (t: AccountType) => {
    switch (t) {
      case 'savings':
        return PiggyBank;
      case 'cash':
        return Wallet;
      case 'investment':
        return TrendingUp;
      case 'checking':
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Contas & Carteiras
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
            {accounts.length} Contas Cadastradas
          </h2>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Saldo acumulado total de {formatCurrency(summary.totalBalance)}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-account"
          className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Conta
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {accounts.map((acc) => {
          const Icon = getTypeIcon(acc.type);

          return (
            <div
              key={acc.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden min-w-0"
            >
              {/* Top Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: acc.color || '#10B981' }}
              />

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: acc.color || '#10B981' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{acc.name}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {acc.bank} • {getTypeLabel(acc.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(acc)}
                      id={`btn-edit-acc-${acc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Editar Conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      id={`btn-delete-acc-${acc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Excluir Conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-3 sm:my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Saldo em Conta
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black mt-0.5 block truncate ${
                      acc.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                    title={formatCurrency(acc.currentBalance)}
                  >
                    {formatCurrency(acc.currentBalance)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span className="truncate">Saldo inicial: {formatCurrency(acc.initialBalance || 0)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating / Editing Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Inter, Carteira Dinheiro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instituição / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Itaú, Bradesco"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Poupança</option>
                    <option value="cash">Dinheiro Físico</option>
                    <option value="investment">Investimento</option>
                  </select>
                </div>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialBalanceStr}
                    onChange={(e) => setInitialBalanceStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {/* Color Pick */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#10B981', '#0055FF', '#8A05BE', '#FF7A00', '#E11D48', '#0F172A', '#0284C7'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-xl transition-transform ${
                          color === c ? 'scale-110 ring-2 ring-emerald-600 ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingAccount ? 'Atualizar Conta' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
