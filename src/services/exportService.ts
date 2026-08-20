import { Transaction, Account, Category } from '../types';
import { formatDateBR } from '../lib/utils/dates';

export const exportService = {
  exportTransactionsToCSV(
    transactions: Transaction[],
    accounts: Account[],
    categories: Category[],
    filename = 'finance_app_transacoes.csv'
  ): void {
    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const headers = [
      'Data',
      'Tipo',
      'Descrição',
      'Valor (R$)',
      'Categoria',
      'Conta / Cartão',
      'Forma de Pagamento',
      'Parcela',
      'Mês Fatura',
      'Observações',
    ];

    const typeLabels: Record<string, string> = {
      income: 'Receita',
      expense: 'Despesa',
      transfer: 'Transferência',
      card_expense: 'Compra no Cartão',
      card_payment: 'Pagamento de Fatura',
    };

    const rows = transactions.map((t) => {
      const formattedDate = formatDateBR(t.date);
      const typeLabel = typeLabels[t.type] || t.type;
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const val = (t.amount / 100).toFixed(2).replace('.', ',');
      const catName = `"${(catMap.get(t.categoryId) || 'Sem Categoria').replace(/"/g, '""')}"`;
      const accName = `"${(accMap.get(t.accountId) || t.cardId || '-').replace(/"/g, '""')}"`;
      const method = t.paymentMethod || '';
      const installment = t.isInstallment ? `${t.currentInstallment}/${t.totalInstallments}` : 'À vista';
      const invoice = t.invoiceMonth || '';
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;

      return [formattedDate, typeLabel, desc, val, catName, accName, method, installment, invoice, notes].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportFullBackupToJSON(
    data: {
      transactions: Transaction[];
      accounts: Account[];
      categories: Category[];
      exportedAt: string;
    },
    filename = 'finance_app_backup.json'
  ): void {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
