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
  Check,
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
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Patrimônio Líquido em Contas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            {formatCurrency(summary.totalBalance)}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {accounts.length} contas bancárias e carteiras cadastradas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-account"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Conta Bancária
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const Icon = getTypeIcon(acc.type);
          return (
            <div
              key={acc.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: acc.color || '#0EA5E9' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm tracking-tight">{acc.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {acc.bank} • {getTypeLabel(acc.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      id={`btn-edit-account-${acc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Editar Conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      id={`btn-delete-account-${acc.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Saldo Disponível
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight">
                {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome da Conta / Banco
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, Carteira"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Instituição Financeira
                </label>
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  placeholder="Ex: Nu Pagamentos S.A., Banco Itaú"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Conta
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="checking">Conta Corrente</option>
                  <option value="savings">Conta Poupança</option>
                  <option value="cash">Dinheiro em Espécie / Carteira</option>
                  <option value="investment">Investimentos / Renda Fixa</option>
                  <option value="other">Outra</option>
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    value={initialBalanceStr}
                    onChange={(e) => setInitialBalanceStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {['#8A05BE', '#EC7000', '#10B981', '#0EA5E9', '#3B82F6', '#EF4444', '#64748B'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          color === c ? 'scale-110 border-slate-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
