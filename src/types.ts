export type PeriodStatus = 'Ativo' | 'Encerrado';

export interface Period {
  id: string;
  name: string;
  status: PeriodStatus;
  startDate: string;
  endDate: string;
  location: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  defaultPrice: number;
}

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export type SaleStatus = 'Pago' | 'Parcial' | 'Fiado';
export type SalePaymentType = 'A_VISTA' | 'FIADO' | 'PARCIAL';

export interface Sale {
  id: string;
  periodId: string;
  buyerName: string;
  items: CartItem[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: string;
  status: SaleStatus;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  saleId: string;
  buyerName: string;
  amount: number;
  periodId: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  periodId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

export interface Merchandise {
  id: string;
  periodId: string;
  supplier: string;
  description: string;
  amount: number;
  invoiceRef: string;
  hasInvoice: boolean;
  date: string;
}

export interface DebtorSummary {
  buyerName: string;
  totalPending: number;
  salesList: Sale[];
}

export type TabId = 'inicio' | 'vendas' | 'financeiro' | 'periodos' | 'produtos';
export type FinancialSubTab = 'resumo' | 'despesas' | 'compras' | 'fiados';

export interface ToastNotice {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}
