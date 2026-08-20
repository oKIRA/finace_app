import React, { useState } from 'react';
import {
  Settings,
  User,
  Tags,
  Download,
  Database,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinanceData } from '../../context/FinanceDataContext';
import { useDateFilter } from '../../context/DateFilterContext';
import { categoriesService } from '../../services/categoriesService';
import { demoDataService } from '../../services/demoDataService';
import { exportService } from '../../services/exportService';
import { Category, CategoryType } from '../../types';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { categories, allTransactions, accounts, refreshData } = useFinanceData();
  const { selectedYear, selectedMonth } = useDateFilter();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryType>('expense');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [submittingCat, setSubmittingCat] = useState(false);

  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;

    try {
      setSubmittingCat(true);
      await categoriesService.createCategory(user.uid, {
        name: newCatName.trim(),
        type: newCatType,
        color: newCatColor,
        icon: newCatIcon,
        isDefault: false,
      });

      await refreshData();
      setIsCategoryModalOpen(false);
      setNewCatName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!user) return;
    if (window.confirm(`Deseja realmente excluir a categoria "${cat.name}"?`)) {
      try {
        await categoriesService.deleteCategory(user.uid, cat.id);
        await refreshData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSeedDemo = async () => {
    if (!user) return;
    if (
      window.confirm(
        'Deseja carregar os dados de demonstração (Nubank, Itaú, Salário, Notebook em 12x, Aluguel) a partir de Agosto de 2026?'
      )
    ) {
      try {
        setSeedingDemo(true);
        setDemoMessage(null);
        await demoDataService.seedDemoData(user.uid);
        await refreshData();
        setDemoMessage('Dados de demonstração carregados com sucesso!');
      } catch (err) {
        console.error(err);
        setDemoMessage('Erro ao carregar dados de demonstração.');
      } finally {
        setSeedingDemo(false);
      }
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;
    if (
      window.prompt(
        'ATENÇÃO: Isso excluirá permanentemente todas as suas contas, transações, cartões e faturas. Digite "EXCLUIR" para confirmar:'
      ) === 'EXCLUIR'
    ) {
      try {
        setSeedingDemo(true);
        await demoDataService.clearAllUserData(user.uid);
        await categoriesService.seedDefaultCategories(user.uid);
        await refreshData();
        setDemoMessage('Todos os dados foram resetados com sucesso.');
      } catch (err) {
        console.error(err);
      } finally {
        setSeedingDemo(false);
      }
    }
  };

  const handleExportCSV = () => {
    exportService.exportTransactionsToCSV(
      allTransactions,
      accounts,
      categories,
      `finance_app_extrato_${selectedYear}_${selectedMonth}.csv`
    );
  };

  const handleExportJSON = () => {
    exportService.exportFullBackupToJSON({
      transactions: allTransactions,
      accounts,
      categories,
      exportedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Configurações do Aplicativo
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Preferências, gestão de categorias, exportação de dados e segurança
        </p>
      </div>

      {demoMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{demoMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">
              {user?.displayName || 'Usuário Pessoal'}
            </h3>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'Sessão Conectada'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl min-w-0">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Moeda Padrão</span>
            <span className="font-black text-slate-800 truncate block">BRL (R$) Real</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl min-w-0">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Timezone</span>
            <span className="font-black text-slate-800 truncate block">America/Sao_Paulo</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl min-w-0">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Segurança</span>
            <span className="font-black text-emerald-600 flex items-center gap-1 truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Regras RBAC Ativas
            </span>
          </div>
        </div>
      </div>

      {/* Export Data Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Exportação de Dados</h3>
          <p className="text-xs text-slate-400">
            Baixe seus registros a qualquer momento para backup ou planilhas externas
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            id="btn-settings-export-csv"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            Exportar Todas Transações (CSV)
          </button>

          <button
            onClick={handleExportJSON}
            id="btn-settings-export-json"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <FileJson className="w-4 h-4 text-blue-600 shrink-0" />
            Backup Completo em JSON
          </button>
        </div>
      </div>

      {/* Categories Management */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight truncate">
              Categorias Personalizadas
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {categories.length} categorias cadastradas para receitas e despesas
            </p>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            id="btn-add-category"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Categoria
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium hover:border-slate-300 transition-colors min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate text-slate-800 font-semibold">{cat.name}</span>
              </div>

              {!cat.isDefault && (
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-slate-300 hover:text-rose-600 p-1 shrink-0 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demo Data & Danger Zone */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Ambiente de Testes & Demonstração
          </h3>
          <p className="text-xs text-slate-400">
            Ferramentas para carregar dados fictícios realistas ou resetar a base
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSeedDemo}
            disabled={seedingDemo}
            id="btn-seed-demo-data"
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-purple-600 shrink-0 ${seedingDemo ? 'animate-spin' : ''}`} />
            Popular Demonstração (Agosto 2026)
          </button>

          <button
            onClick={handleClearAllData}
            disabled={seedingDemo}
            id="btn-clear-all-data"
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            Limpar Todos os Dados
          </button>
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Tags className="w-5 h-5 text-emerald-600" />
                Nova Categoria
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cursos, Pet shop, Lazer"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tipo de Aplicação
                </label>
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as CategoryType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="expense">Despesas</option>
                  <option value="income">Receitas</option>
                  <option value="both">Ambas (Receitas e Despesas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cor da Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#10B981', '#0055FF', '#8A05BE', '#FF7A00', '#E11D48', '#0F172A', '#CA8A04', '#06B6D4'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewCatColor(c)}
                        className={`w-7 h-7 rounded-xl transition-transform ${
                          newCatColor === c ? 'scale-110 ring-2 ring-emerald-600 ring-offset-2' : ''
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
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCat}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submittingCat ? 'Salvando...' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
