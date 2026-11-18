import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Calendar,
  Package,
  Plus,
  CheckCircle2,
  X,
  Menu,
  Download,
} from 'lucide-react';

import {
  Period,
  Product,
  CartItem,
  Sale,
  SaleStatus,
  SalePaymentType,
  DebtPayment,
  Expense,
  Merchandise,
  DebtorSummary,
  TabId,
  FinancialSubTab,
  ToastNotice,
  ConfirmDialogState,
} from './types';

import {
  INITIAL_PERIODS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_DEBT_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_MERCHANDISE,
} from './data/initialData';

import {
  formatMoney,
  formatShortDate,
  exportPeriodReportCsv,
} from './utils/formatters';

import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { FinanceView } from './components/FinanceView';
import { PeriodsView } from './components/PeriodsView';
import { ProductsView } from './components/ProductsView';

import {
  PayDebtModal,
  NewPeriodModal,
  NewProductModal,
  EditProductModal,
  NewExpenseModal,
  NewMerchandiseModal,
  ConfirmDeleteModal,
} from './components/Modals';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  // --- PERSISTENT DOMAIN STATE (PRESERVED KEYS & STRUCTURE) ---
  const [periods, setPeriods] = useState<Period[]>(() =>
    loadFromStorage('eventsales_periods', INITIAL_PERIODS)
  );

  const [activePeriodId, setActivePeriodId] = useState<string>(() => {
    try {
      return localStorage.getItem('eventsales_active_period') || 'per_1';
    } catch {
      return 'per_1';
    }
  });

  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage('eventsales_products', INITIAL_PRODUCTS)
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    loadFromStorage('eventsales_sales', INITIAL_SALES)
  );

  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() =>
    loadFromStorage('eventsales_debt_payments', INITIAL_DEBT_PAYMENTS)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage('eventsales_expenses', INITIAL_EXPENSES)
  );

  const [merchandise, setMerchandise] = useState<Merchandise[]>(() =>
    loadFromStorage('eventsales_merchandise', INITIAL_MERCHANDISE)
  );

  // --- NAVIGATION & UI FEEDBACK ---
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [financialSubTab, setFinancialSubTab] =
    useState<FinancialSubTab>('resumo');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(
    null
  );

  const pushToast = useCallback(
    (message: string, tone: ToastNotice['tone'] = 'success') => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  // --- PERSISTENCE SYNC ---
  useEffect(() => {
    try {
      localStorage.setItem('eventsales_periods', JSON.stringify(periods));
      localStorage.setItem('eventsales_active_period', activePeriodId);
      localStorage.setItem('eventsales_products', JSON.stringify(products));
      localStorage.setItem('eventsales_sales', JSON.stringify(sales));
      localStorage.setItem(
        'eventsales_debt_payments',
        JSON.stringify(debtPayments)
      );
      localStorage.setItem('eventsales_expenses', JSON.stringify(expenses));
      localStorage.setItem(
        'eventsales_merchandise',
        JSON.stringify(merchandise)
      );
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }, [
    periods,
    activePeriodId,
    products,
    sales,
    debtPayments,
    expenses,
    merchandise,
  ]);

  // --- ACTIVE PERIOD ---
  const activePeriod = useMemo<Period>(() => {
    return (
      periods.find((p) => p.id === activePeriodId) ||
      periods[0] || {
        id: 'none',
        name: 'Sem Período',
        status: 'Ativo',
        startDate: '-',
        endDate: '-',
        location: 'Não informada',
      }
    );
  }, [periods, activePeriodId]);

  const periodNameById = useMemo(() => {
    const map: Record<string, string> = {};
    periods.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [periods]);

  // --- MODALS & FORMS STATE ---
  const todayIso = () => new Date().toISOString().split('T')[0];

  const [modalNewPeriod, setModalNewPeriod] = useState(false);
  const [modalNewProduct, setModalNewProduct] = useState(false);
  const [modalEditProduct, setModalEditProduct] = useState<Product | null>(
    null
  );
  const [modalNewExpense, setModalNewExpense] = useState(false);
  const [modalNewMerchandise, setModalNewMerchandise] = useState(false);
  const [modalPayDebt, setModalPayDebt] = useState<DebtorSummary | null>(null);
  const [debtFormError, setDebtFormError] = useState('');

  const [periodForm, setPeriodForm] = useState({
    name: '',
    startDate: todayIso(),
    endDate: '',
    location: '',
  });
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Bebidas',
    costPrice: '',
    defaultPrice: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'Infraestrutura',
    amount: '',
    date: todayIso(),
  });
  const [merchandiseForm, setMerchandiseForm] = useState({
    supplier: '',
    description: '',
    amount: '',
    invoiceRef: '',
    hasInvoice: true,
    date: todayIso(),
  });
  const [debtPayForm, setDebtPayForm] = useState({
    amount: '',
    paymentMethod: 'PIX',
  });

  // --- KNOWN BUYERS, RECURRING EXPENSE DATA & KNOWN SUPPLIERS ---
  const knownBuyers = useMemo(() => {
    const names = new Set<string>();
    sales.forEach((s) => {
      const trimmed = s.buyerName.trim();
      if (trimmed && trimmed !== 'Venda avulsa') {
        names.add(trimmed);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [sales]);

  const recurringExpenseCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.category) {
        counts[e.category] = (counts[e.category] || 0) + 1;
      }
    });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] || 'Infraestrutura';
  }, [expenses]);

  const recurringExpenseDescriptions = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const trimmed = e.description.trim();
      if (trimmed && !trimmed.startsWith('Gasto com ')) {
        set.add(trimmed);
      }
    });
    return Array.from(set).slice(0, 8);
  }, [expenses]);

  const knownSuppliers = useMemo(() => {
    const set = new Set<string>();
    merchandise.forEach((m) => {
      const trimmed = m.supplier.trim();
      if (trimmed && trimmed !== 'Fornecedor Diversos') {
        set.add(trimmed);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [merchandise]);

  const openNewPeriodModal = () => {
    setPeriodForm({
      name: '',
      startDate: todayIso(),
      endDate: '',
      location: '',
    });
    setModalNewPeriod(true);
  };

  const openNewExpenseModal = () => {
    setExpenseForm({
      description: '',
      category: recurringExpenseCategory,
      amount: '',
      date: todayIso(),
    });
    setModalNewExpense(true);
  };

  const openNewMerchandiseModal = () => {
    setMerchandiseForm({
      supplier: '',
      description: '',
      amount: '',
      invoiceRef: '',
      hasInvoice: false,
      date: todayIso(),
    });
    setModalNewMerchandise(true);
  };

  // --- PERIOD-SCOPED COLLECTIONS & METRICS ---
  const currentPeriodSales = useMemo(
    () => sales.filter((s) => s.periodId === activePeriodId),
    [sales, activePeriodId]
  );
  const currentPeriodExpenses = useMemo(
    () => expenses.filter((e) => e.periodId === activePeriodId),
    [expenses, activePeriodId]
  );
  const currentPeriodMerchandise = useMemo(
    () => merchandise.filter((m) => m.periodId === activePeriodId),
    [merchandise, activePeriodId]
  );
  const currentPeriodDebtPayments = useMemo(
    () => debtPayments.filter((dp) => dp.periodId === activePeriodId),
    [debtPayments, activePeriodId]
  );

  const metrics = useMemo(() => {
    const grossSalesTotal = currentPeriodSales.reduce(
      (acc, s) => acc + s.totalAmount,
      0
    );
    const directCashFromSales = currentPeriodSales.reduce(
      (acc, s) => acc + (s.paidAmount || 0),
      0
    );
    const debtCashReceivedThisPeriod = currentPeriodDebtPayments.reduce(
      (acc, dp) => acc + dp.amount,
      0
    );
    const totalCashReceived = directCashFromSales + debtCashReceivedThisPeriod;
    const periodPendingDebts = currentPeriodSales.reduce(
      (acc, s) => acc + (s.pendingAmount || 0),
      0
    );
    const totalExpenses = currentPeriodExpenses.reduce(
      (acc, e) => acc + e.amount,
      0
    );
    const totalMerchandiseCost = currentPeriodMerchandise.reduce(
      (acc, m) => acc + m.amount,
      0
    );
    const netCashResult =
      totalCashReceived - (totalExpenses + totalMerchandiseCost);

    return {
      grossSalesTotal,
      totalCashReceived,
      directCashFromSales,
      debtCashReceivedThisPeriod,
      periodPendingDebts,
      totalExpenses,
      totalMerchandiseCost,
      netCashResult,
    };
  }, [
    currentPeriodSales,
    currentPeriodExpenses,
    currentPeriodMerchandise,
    currentPeriodDebtPayments,
  ]);

  // --- GLOBAL DEBT AGGREGATION ACROSS ALL TOURNAMENTS ---
  const buyersWithDebt = useMemo<DebtorSummary[]>(() => {
    const debtMap: Record<string, DebtorSummary> = {};
    sales.forEach((s) => {
      if (s.pendingAmount > 0.004) {
        if (!debtMap[s.buyerName]) {
          debtMap[s.buyerName] = {
            buyerName: s.buyerName,
            totalPending: 0,
            salesList: [],
          };
        }
        debtMap[s.buyerName].totalPending += s.pendingAmount;
        debtMap[s.buyerName].salesList.push(s);
      }
    });
    return Object.values(debtMap).sort(
      (a, b) => b.totalPending - a.totalPending
    );
  }, [sales]);

  const totalGlobalPendingDebts = useMemo(
    () => buyersWithDebt.reduce((acc, b) => acc + b.totalPending, 0),
    [buyersWithDebt]
  );

  // --- REGISTER SALE ---
  const handleRegisterSale = ({
    buyerName,
    items,
    paymentType,
    paidNow,
    paymentMethod,
  }: {
    buyerName: string;
    items: CartItem[];
    paymentType: SalePaymentType;
    paidNow: number;
    paymentMethod: string;
  }) => {
    const totalAmount = Number(
      items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0).toFixed(2)
    );

    let paid = 0;
    let pending = 0;
    let status: SaleStatus = 'Pago';
    let methodLabel = paymentMethod;

    if (paymentType === 'A_VISTA') {
      paid = totalAmount;
      pending = 0;
      status = 'Pago';
    } else if (paymentType === 'FIADO') {
      paid = 0;
      pending = totalAmount;
      status = 'Fiado';
      methodLabel = 'Fiado';
    } else if (paymentType === 'PARCIAL') {
      if (paidNow >= totalAmount) {
        paid = totalAmount;
        pending = 0;
        status = 'Pago';
      } else {
        paid = Number(paidNow.toFixed(2));
        pending = Number((totalAmount - paid).toFixed(2));
        status = 'Parcial';
        methodLabel = `Parcial (${paymentMethod} + Fiado)`;
      }
    }

    const newSale: Sale = {
      id: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      periodId: activePeriodId,
      buyerName,
      items,
      totalAmount,
      paidAmount: paid,
      pendingAmount: pending,
      paymentMethod: methodLabel,
      status,
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);

    if (paymentType === 'FIADO') {
      pushToast(
        `Fiado de ${formatMoney(totalAmount)} anotado para ${buyerName}.`
      );
    } else if (paymentType === 'PARCIAL') {
      pushToast(
        `Venda registrada! ${formatMoney(paid)} pago e ${formatMoney(
          pending
        )} no fiado de ${buyerName}.`
      );
    } else {
      pushToast(
        `Venda de ${formatMoney(totalAmount)} confirmada (${paymentMethod}).`
      );
    }
  };

  // --- IMMUTABLE FIFO DEBT REPAYMENT ---
  const openPayDebtForBuyer = (buyerName: string) => {
    const found = buyersWithDebt.find((b) => b.buyerName === buyerName);
    if (!found) return;
    setDebtFormError('');
    setDebtPayForm({
      amount: found.totalPending.toFixed(2),
      paymentMethod: 'PIX',
    });
    setModalPayDebt(found);
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPayDebt) return;

    const payAmount = parseFloat(debtPayForm.amount);
    if (!payAmount || payAmount <= 0) {
      setDebtFormError('Informe o valor recebido (maior que zero).');
      return;
    }

    const buyerName = modalPayDebt.buyerName;
    let remainingToPay = Math.min(payAmount, modalPayDebt.totalPending);
    const newPayments: DebtPayment[] = [];

    const buyerPendingIdsOldestFirst = sales
      .filter((s) => s.buyerName === buyerName && s.pendingAmount > 0.004)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((s) => s.id);

    const abatementBySaleId: Record<string, number> = {};
    for (const saleId of buyerPendingIdsOldestFirst) {
      if (remainingToPay <= 0.004) break;
      const targetSale = sales.find((s) => s.id === saleId);
      if (!targetSale) continue;

      const paymentForThisSale = Number(
        Math.min(targetSale.pendingAmount, remainingToPay).toFixed(2)
      );
      abatementBySaleId[saleId] = paymentForThisSale;
      remainingToPay = Number((remainingToPay - paymentForThisSale).toFixed(2));

      newPayments.push({
        id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        saleId: targetSale.id,
        buyerName,
        amount: paymentForThisSale,
        periodId: activePeriodId,
        paymentMethod: debtPayForm.paymentMethod,
        createdAt: new Date().toISOString(),
      });
    }

    setSales((prev) =>
      prev.map((sale) => {
        const abated = abatementBySaleId[sale.id];
        if (!abated) return sale;
        const nextPending = Math.max(
          0,
          Number((sale.pendingAmount - abated).toFixed(2))
        );
        const nextPaid = Number((sale.paidAmount + abated).toFixed(2));
        return {
          ...sale,
          pendingAmount: nextPending,
          paidAmount: nextPaid,
          status: nextPending <= 0.004 ? 'Pago' : 'Parcial',
        };
      })
    );

    const totalApplied = newPayments.reduce((acc, p) => acc + p.amount, 0);
    setDebtPayments((prev) => [...newPayments, ...prev]);
    setModalPayDebt(null);
    setDebtPayForm({ amount: '', paymentMethod: 'PIX' });
    setDebtFormError('');
    pushToast(
      `Pagamento de ${formatMoney(totalApplied)} recebido de ${buyerName}.`
    );
  };

  // --- ENTITY CRUD HANDLERS ---
  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodForm.name.trim()) return;

    const newP: Period = {
      id: `per_${Date.now()}`,
      name: periodForm.name.trim(),
      status: 'Ativo',
      startDate: periodForm.startDate || todayIso(),
      endDate: periodForm.endDate || '-',
      location: periodForm.location.trim() || 'Não informada',
    };

    setPeriods((prev) => [newP, ...prev]);
    setActivePeriodId(newP.id);
    setPeriodForm({
      name: '',
      startDate: todayIso(),
      endDate: '',
      location: '',
    });
    setModalNewPeriod(false);
    pushToast(`Evento "${newP.name}" criado e selecionado.`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      name: productForm.name.trim(),
      category: productForm.category,
      costPrice: parseFloat(productForm.costPrice) || 0,
      defaultPrice: parseFloat(productForm.defaultPrice) || 0,
    };

    setProducts((prev) => [...prev, newProd]);
    setProductForm({
      name: '',
      category: 'Bebidas',
      costPrice: '',
      defaultPrice: '',
    });
    setModalNewProduct(false);
    pushToast(`Produto "${newProd.name}" cadastrado.`);
  };

  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditProduct) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === modalEditProduct.id ? modalEditProduct : p))
    );
    pushToast(`Produto "${modalEditProduct.name}" atualizado.`);
    setModalEditProduct(null);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(expenseForm.amount) || 0;
    if (amountVal <= 0) return;

    const chosenCategory = expenseForm.category || recurringExpenseCategory;
    const newExp: Expense = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      periodId: activePeriodId,
      description:
        expenseForm.description.trim() || `Gasto com ${chosenCategory}`,
      category: chosenCategory,
      amount: amountVal,
      date: expenseForm.date || todayIso(),
    };

    setExpenses((prev) => [newExp, ...prev]);
    setExpenseForm({
      description: '',
      category: recurringExpenseCategory,
      amount: '',
      date: todayIso(),
    });
    setModalNewExpense(false);
    pushToast(`Despesa "${newExp.description}" salva.`);
  };

  const handleCreateMerchandise = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(merchandiseForm.amount) || 0;
    if (amountVal <= 0) return;

    const invoice = merchandiseForm.invoiceRef.trim();
    const supplierName = merchandiseForm.supplier.trim();
    const desc =
      merchandiseForm.description.trim() ||
      (supplierName ? `Compra em ${supplierName}` : 'Reposição de mercadorias');

    const newMerch: Merchandise = {
      id: `MER-${Math.floor(100 + Math.random() * 900)}`,
      periodId: activePeriodId,
      supplier: supplierName || 'Fornecedor Diversos',
      description: desc,
      amount: amountVal,
      invoiceRef: invoice || 'S/N',
      hasInvoice: Boolean(invoice),
      date: merchandiseForm.date || todayIso(),
    };

    setMerchandise((prev) => [newMerch, ...prev]);
    setMerchandiseForm({
      supplier: '',
      description: '',
      amount: '',
      invoiceRef: '',
      hasInvoice: false,
      date: todayIso(),
    });
    setModalNewMerchandise(false);
    pushToast(
      `Compra de ${formatMoney(newMerch.amount)} registrada.`
    );
  };

  const handleExportCsv = () => {
    exportPeriodReportCsv({
      period: activePeriod,
      sales: currentPeriodSales,
      expenses: currentPeriodExpenses,
      merchandise: currentPeriodMerchandise,
      debtPayments: currentPeriodDebtPayments,
      metrics,
    });
    pushToast(`Planilha de "${activePeriod.name}" baixada.`, 'info');
  };

  // --- NAVIGATION ---
  const navItems: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: 'inicio', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas e Caixa', icon: ShoppingCart },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'periodos', label: 'Eventos', icon: Calendar },
    { id: 'produtos', label: 'Produtos', icon: Package },
  ];

  const activeTabLabel =
    navItems.find((n) => n.id === activeTab)?.label || 'Painel Geral';

  const handleNavigate = (tab: TabId, subTab?: FinancialSubTab) => {
    setActiveTab(tab);
    if (subTab) setFinancialSubTab(subTab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            EventSales
          </span>
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="truncate text-xs font-semibold text-slate-600">
            {activeTabLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6D4AFF] text-xs font-bold tracking-wider text-white">
                ES
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                  EventSales
                </p>
                <p className="truncate text-xs text-slate-500">
                  Organizador · adm
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 p-3" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#6D4AFF] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    size={17}
                    className={isActive ? 'text-white' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ACTIVE EVENT SWITCHER */}
        <div className="border-t border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Evento ativo</span>
            <span
              className={`font-medium ${
                activePeriod.status === 'Ativo'
                  ? 'text-emerald-700'
                  : 'text-slate-500'
              }`}
            >
              {activePeriod.status}
            </span>
          </div>
          <select
            aria-label="Selecionar evento ativo"
            value={activePeriodId}
            onChange={(e) => {
              setActivePeriodId(e.target.value);
              const chosen = periods.find((p) => p.id === e.target.value);
              if (chosen) {
                pushToast(`Evento alterado para "${chosen.name}".`, 'info');
              }
            }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs font-semibold text-slate-900 focus:border-[#6D4AFF] focus:bg-white focus:outline-none"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="truncate text-[11px] text-slate-500">
            {activePeriod.location} · {formatShortDate(activePeriod.startDate)}
          </p>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
        />
      )}

      {/* MAIN WORKSPACE */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* DESKTOP TOP BAR CONTRACT */}
        <header className="hidden md:flex sticky top-0 z-20 h-16 items-center justify-between gap-8 border-b border-slate-200 bg-white px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm whitespace-nowrap">
            <span className="font-bold tracking-tight text-slate-900 shrink-0">
              EventSales
            </span>
            <span className="text-slate-300 shrink-0" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-slate-600 shrink-0">
              {activeTabLabel}
            </span>
            <span className="text-slate-300 shrink-0" aria-hidden="true">
              /
            </span>
            <span className="truncate max-w-xs font-semibold text-slate-900">
              {activePeriod.name}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Download size={14} />
              <span>Exportar planilha</span>
            </button>

            {activeTab === 'inicio' && (
              <button
                type="button"
                onClick={() => handleNavigate('vendas')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
              >
                <Plus size={15} />
                <span>Nova venda</span>
              </button>
            )}

            {activeTab === 'financeiro' && financialSubTab === 'despesas' && (
              <button
                type="button"
                onClick={openNewExpenseModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
              >
                <Plus size={15} />
                <span>Lançar despesa</span>
              </button>
            )}

            {activeTab === 'financeiro' && financialSubTab === 'compras' && (
              <button
                type="button"
                onClick={openNewMerchandiseModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
              >
                <Plus size={15} />
                <span>Registrar compra</span>
              </button>
            )}

            {activeTab === 'periodos' && (
              <button
                type="button"
                onClick={openNewPeriodModal}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
              >
                <Plus size={15} />
                <span>Novo evento</span>
              </button>
            )}

            {activeTab === 'produtos' && (
              <button
                type="button"
                onClick={() => setModalNewProduct(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
              >
                <Plus size={15} />
                <span>Novo produto</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE VIEWPORT */}
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          {activeTab === 'inicio' && (
            <DashboardView
              activePeriod={activePeriod}
              currentPeriodSales={currentPeriodSales}
              metrics={metrics}
              buyersWithDebt={buyersWithDebt}
              totalGlobalPendingDebts={totalGlobalPendingDebts}
              onNavigate={handleNavigate}
              onOpenPayDebt={openPayDebtForBuyer}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'vendas' && (
            <SalesView
              activePeriod={activePeriod}
              products={products}
              currentPeriodSales={currentPeriodSales}
              knownBuyers={knownBuyers}
              onRegisterSale={handleRegisterSale}
              onOpenPayDebt={openPayDebtForBuyer}
              onRequestDeleteSale={(sale) =>
                setConfirmDialog({
                  title: 'Remover esta venda?',
                  description: `A venda de ${sale.buyerName} no valor de ${formatMoney(
                    sale.totalAmount
                  )} será apagada deste evento.`,
                  onConfirm: () => {
                    setSales((prev) => prev.filter((s) => s.id !== sale.id));
                    pushToast('Venda removida.', 'info');
                  },
                })
              }
              onNavigateToProducts={() => handleNavigate('produtos')}
            />
          )}

          {activeTab === 'financeiro' && (
            <FinanceView
              activePeriod={activePeriod}
              subTab={financialSubTab}
              onChangeSubTab={setFinancialSubTab}
              metrics={metrics}
              currentPeriodExpenses={currentPeriodExpenses}
              currentPeriodMerchandise={currentPeriodMerchandise}
              currentPeriodDebtPayments={currentPeriodDebtPayments}
              buyersWithDebt={buyersWithDebt}
              periodNameById={periodNameById}
              onOpenNewExpense={openNewExpenseModal}
              onOpenNewMerchandise={openNewMerchandiseModal}
              onOpenPayDebt={openPayDebtForBuyer}
              onRequestDeleteExpense={(exp) =>
                setConfirmDialog({
                  title: 'Remover esta despesa?',
                  description: `O gasto "${exp.description}" (${formatMoney(
                    exp.amount
                  )}) será excluído deste evento.`,
                  onConfirm: () => {
                    setExpenses((prev) => prev.filter((e) => e.id !== exp.id));
                    pushToast('Despesa removida.', 'info');
                  },
                })
              }
              onRequestDeleteMerchandise={(mer) =>
                setConfirmDialog({
                  title: 'Remover esta compra?',
                  description: `A compra "${mer.description}" (${formatMoney(
                    mer.amount
                  )}) será excluída deste evento.`,
                  onConfirm: () => {
                    setMerchandise((prev) =>
                      prev.filter((m) => m.id !== mer.id)
                    );
                    pushToast('Compra removida.', 'info');
                  },
                })
              }
            />
          )}

          {activeTab === 'periodos' && (
            <PeriodsView
              periods={periods}
              activePeriodId={activePeriodId}
              sales={sales}
              onSelectPeriod={(per) => {
                setActivePeriodId(per.id);
                pushToast(`Evento alterado para "${per.name}".`, 'info');
              }}
              onTogglePeriodStatus={(per) => {
                const nextStatus =
                  per.status === 'Ativo' ? 'Encerrado' : 'Ativo';
                setPeriods((prev) =>
                  prev.map((p) =>
                    p.id === per.id ? { ...p, status: nextStatus } : p
                  )
                );
                pushToast(
                  `"${per.name}" agora está ${nextStatus.toLowerCase()}.`,
                  'info'
                );
              }}
              onOpenNewPeriod={openNewPeriodModal}
            />
          )}

          {activeTab === 'produtos' && (
            <ProductsView
              products={products}
              onOpenNewProduct={() => setModalNewProduct(true)}
              onOpenEditProduct={(prod) => setModalEditProduct(prod)}
              onRequestDeleteProduct={(prod) =>
                setConfirmDialog({
                  title: 'Remover produto do catálogo?',
                  description: `"${prod.name}" não aparecerá mais nas novas vendas, mas as vendas antigas serão mantidas.`,
                  confirmLabel: 'Remover produto',
                  onConfirm: () => {
                    setProducts((prev) =>
                      prev.filter((p) => p.id !== prod.id)
                    );
                    pushToast(`Produto "${prod.name}" removido.`, 'info');
                  },
                })
              }
            />
          )}
        </div>
      </main>

      {/* TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={
                    t.tone === 'error'
                      ? 'text-red-400 shrink-0'
                      : 'text-emerald-400 shrink-0'
                  }
                />
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== t.id))
                }
                className="text-slate-400 hover:text-white"
                aria-label="Fechar aviso"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {modalPayDebt && (
        <PayDebtModal
          debtor={modalPayDebt}
          activePeriodName={activePeriod.name}
          form={debtPayForm}
          setForm={(updater) => {
            setDebtPayForm(updater);
            if (debtFormError) setDebtFormError('');
          }}
          errorMessage={debtFormError}
          onClose={() => {
            setModalPayDebt(null);
            setDebtFormError('');
          }}
          onSubmit={handlePayDebtSubmit}
        />
      )}

      {modalNewPeriod && (
        <NewPeriodModal
          form={periodForm}
          setForm={setPeriodForm}
          onClose={() => setModalNewPeriod(false)}
          onSubmit={handleCreatePeriod}
        />
      )}

      {modalNewProduct && (
        <NewProductModal
          form={productForm}
          setForm={setProductForm}
          onClose={() => setModalNewProduct(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {modalEditProduct && (
        <EditProductModal
          product={modalEditProduct}
          setProduct={setModalEditProduct}
          onClose={() => setModalEditProduct(null)}
          onSubmit={handleSaveEditedProduct}
        />
      )}

      {modalNewExpense && (
        <NewExpenseModal
          form={expenseForm}
          setForm={setExpenseForm}
          recurringDescriptions={recurringExpenseDescriptions}
          onClose={() => setModalNewExpense(false)}
          onSubmit={handleCreateExpense}
        />
      )}

      {modalNewMerchandise && (
        <NewMerchandiseModal
          form={merchandiseForm}
          setForm={setMerchandiseForm}
          knownSuppliers={knownSuppliers}
          onClose={() => setModalNewMerchandise(false)}
          onSubmit={handleCreateMerchandise}
        />
      )}

      {confirmDialog && (
        <ConfirmDeleteModal
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
