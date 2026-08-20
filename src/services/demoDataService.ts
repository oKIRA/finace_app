import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { categoriesService } from './categoriesService';
import { accountsService } from './accountsService';
import { cardsService } from './cardsService';
import { transactionsService } from './transactionsService';
import { recurringService } from './recurringService';
import { budgetsService } from './budgetsService';
import { goalsService } from './goalsService';

export const demoDataService = {
  async clearAllUserData(userId: string): Promise<void> {
    const subcollections = [
      'accounts',
      'cards',
      'transactions',
      'invoices',
      'recurring',
      'budgets',
      'goals',
      'categories',
    ];

    for (const sub of subcollections) {
      const colRef = collection(db, 'users', userId, sub);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  },

  async seedDemoData(userId: string): Promise<void> {
    // 1. Categories
    const categories = await categoriesService.getCategories(userId);
    const catMap = new Map(categories.map((c) => [c.name, c.id]));

    const getCatId = (name: string): string => {
      for (const [k, v] of catMap.entries()) {
        if (k.toLowerCase().includes(name.toLowerCase())) return v;
      }
      return categories[0]?.id || '';
    };

    // 2. Accounts
    const nubankAcc = await accountsService.createAccount(userId, {
      name: 'Nubank',
      bank: 'Nubank',
      type: 'checking',
      initialBalance: 500000, // R$ 5.000,00
      currentBalance: 500000,
      color: '#8A05BE',
    });

    const itauAcc = await accountsService.createAccount(userId, {
      name: 'Itaú Personalité',
      bank: 'Itaú',
      type: 'checking',
      initialBalance: 720000, // R$ 7.200,00
      currentBalance: 720000,
      color: '#EC7000',
    });

    await accountsService.createAccount(userId, {
      name: 'Dinheiro em Carteira',
      bank: 'Dinheiro',
      type: 'cash',
      initialBalance: 30000, // R$ 300,00
      currentBalance: 30000,
      color: '#10B981',
    });

    // 3. Credit Cards
    const nubankCard = await cardsService.createCard(userId, {
      name: 'Nubank Ultravioleta',
      bank: 'Nubank',
      brand: 'mastercard',
      limit: 800000, // R$ 8.000,00
      closingDay: 2,
      dueDay: 9,
      color: '#8A05BE',
    });

    await cardsService.createCard(userId, {
      name: 'Itaú Click',
      bank: 'Itaú',
      brand: 'visa',
      limit: 500000, // R$ 5.000,00
      closingDay: 15,
      dueDay: 22,
      color: '#EC7000',
    });

    // 4. Recurring Bills
    await recurringService.createRecurringBill(userId, {
      name: 'Salário Mensal',
      amount: 900000, // R$ 9.000,00
      type: 'income',
      categoryId: getCatId('Salário'),
      accountId: itauAcc.id,
      dueDay: 5,
      frequency: 'monthly',
      active: true,
      notes: 'Recebimento fixo CLT',
    });

    await recurringService.createRecurringBill(userId, {
      name: 'Aluguel & Condomínio',
      amount: 200000, // R$ 2.000,00
      type: 'expense',
      categoryId: getCatId('Casa'),
      accountId: itauAcc.id,
      dueDay: 5,
      frequency: 'monthly',
      active: true,
    });

    await recurringService.createRecurringBill(userId, {
      name: 'Internet Fibra 600MB',
      amount: 12000, // R$ 120,00
      type: 'expense',
      categoryId: getCatId('Casa'),
      accountId: nubankAcc.id,
      dueDay: 10,
      frequency: 'monthly',
      active: true,
    });

    await recurringService.createRecurringBill(userId, {
      name: 'Energia Elétrica (Enel)',
      amount: 18000, // R$ 180,00
      type: 'expense',
      categoryId: getCatId('Casa'),
      accountId: nubankAcc.id,
      dueDay: 20,
      frequency: 'monthly',
      active: true,
    });

    await recurringService.createRecurringBill(userId, {
      name: 'Netflix & Spotify',
      amount: 7500, // R$ 75,00
      type: 'expense',
      categoryId: getCatId('Assinaturas'),
      cardId: nubankCard.id,
      dueDay: 15,
      frequency: 'monthly',
      active: true,
    });

    // 5. Initial Transactions for August 2026 (2026-08)
    // Direct Salary Income
    await transactionsService.createTransaction(userId, {
      type: 'income',
      amount: 900000,
      description: 'Salário Mensal - Empresa',
      categoryId: getCatId('Salário'),
      accountId: itauAcc.id,
      date: '2026-08-05',
      paymentMethod: 'transfer',
      notes: 'Salário creditado',
    });

    // Direct Expenses
    await transactionsService.createTransaction(userId, {
      type: 'expense',
      amount: 200000,
      description: 'Aluguel do Apartamento',
      categoryId: getCatId('Casa'),
      accountId: itauAcc.id,
      date: '2026-08-05',
      paymentMethod: 'pix',
    });

    await transactionsService.createTransaction(userId, {
      type: 'expense',
      amount: 65000,
      description: 'Compras Pão de Açúcar',
      categoryId: getCatId('Alimentação'),
      accountId: nubankAcc.id,
      date: '2026-08-08',
      paymentMethod: 'debit',
    });

    await transactionsService.createTransaction(userId, {
      type: 'expense',
      amount: 4250,
      description: 'Corrida Uber Centro',
      categoryId: getCatId('Transporte'),
      accountId: nubankAcc.id,
      date: '2026-08-11',
      paymentMethod: 'debit',
    });

    await transactionsService.createTransaction(userId, {
      type: 'expense',
      amount: 11500,
      description: 'Farmácia Droga Raia',
      categoryId: getCatId('Saúde'),
      accountId: nubankAcc.id,
      date: '2026-08-14',
      paymentMethod: 'pix',
    });

    // Installment Card Purchase (Notebook R$ 3.600,00 in 12x de R$ 300,00 on Nubank Card)
    await transactionsService.createCardPurchaseWithInstallments(userId, {
      description: 'Notebook Dell Inspiron',
      totalAmount: 360000,
      cardId: nubankCard.id,
      categoryId: getCatId('Compras'),
      date: '2026-08-03',
      installmentsCount: 12,
      closingDay: nubankCard.closingDay,
      notes: 'Trabalho e estudos',
    });

    // Single Card Purchases in August 2026
    await transactionsService.createTransaction(userId, {
      type: 'card_expense',
      amount: 18000,
      description: 'Jantar Família Outback',
      categoryId: getCatId('Alimentação'),
      accountId: '',
      cardId: nubankCard.id,
      date: '2026-08-07',
      paymentMethod: 'credit',
      invoiceMonth: '2026-08',
    });

    await transactionsService.createTransaction(userId, {
      type: 'card_expense',
      amount: 22000,
      description: 'Abastecimento Posto Ipiranga',
      categoryId: getCatId('Transporte'),
      accountId: '',
      cardId: nubankCard.id,
      date: '2026-08-10',
      paymentMethod: 'credit',
      invoiceMonth: '2026-08',
    });

    // 6. Budgets
    await budgetsService.setCategoryBudget(userId, getCatId('Alimentação'), 150000); // R$ 1.500,00
    await budgetsService.setCategoryBudget(userId, getCatId('Transporte'), 80000); // R$ 800,00
    await budgetsService.setCategoryBudget(userId, getCatId('Lazer'), 50000); // R$ 500,00
    await budgetsService.setCategoryBudget(userId, getCatId('Casa'), 250000); // R$ 2.500,00

    // 7. Goals
    await goalsService.createGoal(userId, {
      name: 'Viagem de Férias para a Europa',
      targetAmount: 1500000, // R$ 15.000,00
      currentAmount: 850000, // R$ 8.500,00 (56.7%)
      targetDate: '2027-07-15',
      color: '#0EA5E9',
      icon: 'Plane',
      description: 'Passagens, hospedagem e passeios',
    });

    await goalsService.createGoal(userId, {
      name: 'Reserva de Emergência (6 meses)',
      targetAmount: 3000000, // R$ 30.000,00
      currentAmount: 1800000, // R$ 18.000,00 (60%)
      targetDate: '2026-12-31',
      color: '#10B981',
      icon: 'ShieldCheck',
      description: 'Segurança financeira em renda fixa pós-fixada',
    });
  },
};
