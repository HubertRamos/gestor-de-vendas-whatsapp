import {
  Period,
  Product,
  Sale,
  DebtPayment,
  Expense,
  Merchandise,
} from '../types';

export const INITIAL_PERIODS: Period[] = [
  {
    id: 'per_1',
    name: 'Campeonato de Verão 2026',
    status: 'Ativo',
    startDate: '2026-01-10',
    endDate: '2026-01-25',
    location: 'Arena Central',
  },
  {
    id: 'per_2',
    name: 'Copa Regional de Futsal',
    status: 'Encerrado',
    startDate: '2025-11-05',
    endDate: '2025-11-12',
    location: 'Ginásio Municipal',
  },
  {
    id: 'per_3',
    name: 'Torneio Beneficente de Tênis',
    status: 'Encerrado',
    startDate: '2025-08-15',
    endDate: '2025-08-17',
    location: 'Clube Esportivo',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Água Mineral 500ml',
    category: 'Bebidas',
    costPrice: 1.5,
    defaultPrice: 4.0,
  },
  {
    id: 'prod_2',
    name: 'Cerveja Lata 350ml',
    category: 'Bebidas',
    costPrice: 3.2,
    defaultPrice: 8.0,
  },
  {
    id: 'prod_3',
    name: 'Isotônico 500ml',
    category: 'Bebidas',
    costPrice: 4.0,
    defaultPrice: 10.0,
  },
  {
    id: 'prod_4',
    name: 'Camiseta Oficial do Evento',
    category: 'Vestuário',
    costPrice: 22.0,
    defaultPrice: 50.0,
  },
  {
    id: 'prod_5',
    name: 'Combo Salgado + Refris',
    category: 'Alimentação',
    costPrice: 6.0,
    defaultPrice: 15.0,
  },
  {
    id: 'prod_6',
    name: 'Inscrição Categoria Open',
    category: 'Inscrições',
    costPrice: 0.0,
    defaultPrice: 120.0,
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'VND-1001',
    periodId: 'per_1',
    buyerName: 'Carlos Eduardo',
    items: [
      { productId: 'prod_4', name: 'Camiseta Oficial do Evento', qty: 2, unitPrice: 50.0 },
      { productId: 'prod_2', name: 'Cerveja Lata 350ml', qty: 3, unitPrice: 8.0 },
    ],
    totalAmount: 124.0,
    paidAmount: 124.0,
    pendingAmount: 0.0,
    paymentMethod: 'PIX',
    status: 'Pago',
    createdAt: '2026-01-15T10:30:00',
  },
  {
    id: 'VND-1002',
    periodId: 'per_1',
    buyerName: 'Marcos Vinicius (Time Águia)',
    items: [
      { productId: 'prod_3', name: 'Isotônico 500ml', qty: 10, unitPrice: 10.0 },
      { productId: 'prod_1', name: 'Água Mineral 500ml', qty: 12, unitPrice: 4.0 },
    ],
    totalAmount: 148.0,
    paidAmount: 48.0,
    pendingAmount: 100.0,
    paymentMethod: 'Parcial (PIX + Fiado)',
    status: 'Parcial',
    createdAt: '2026-01-15T11:15:00',
  },
  {
    id: 'VND-1003',
    periodId: 'per_1',
    buyerName: 'Lucas Ferreira',
    items: [
      { productId: 'prod_6', name: 'Inscrição Categoria Open', qty: 1, unitPrice: 120.0 },
    ],
    totalAmount: 120.0,
    paidAmount: 0.0,
    pendingAmount: 120.0,
    paymentMethod: 'Fiado',
    status: 'Fiado',
    createdAt: '2026-01-15T14:00:00',
  },
  {
    id: 'VND-0980',
    periodId: 'per_2',
    buyerName: 'Carlos Eduardo',
    items: [
      { productId: 'prod_2', name: 'Cerveja Lata 350ml', qty: 5, unitPrice: 8.0 },
    ],
    totalAmount: 40.0,
    paidAmount: 0.0,
    pendingAmount: 40.0,
    paymentMethod: 'Fiado',
    status: 'Fiado',
    createdAt: '2025-11-10T16:20:00',
  },
];

export const INITIAL_DEBT_PAYMENTS: DebtPayment[] = [
  {
    id: 'PAY-101',
    saleId: 'VND-1002',
    buyerName: 'Marcos Vinicius (Time Águia)',
    amount: 30.0,
    periodId: 'per_1',
    paymentMethod: 'Dinheiro',
    createdAt: '2026-01-16T09:00:00',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-501',
    periodId: 'per_1',
    description: 'Aluguel de Tendas e Grades',
    category: 'Infraestrutura',
    amount: 450.0,
    date: '2026-01-09',
  },
  {
    id: 'EXP-502',
    periodId: 'per_1',
    description: 'Alimentação da Equipe de Apoio',
    category: 'Alimentação',
    amount: 180.0,
    date: '2026-01-11',
  },
];

export const INITIAL_MERCHANDISE: Merchandise[] = [
  {
    id: 'MER-801',
    periodId: 'per_1',
    supplier: 'Distribuidora de Bebidas Geladas',
    description: 'Lote de Cervejas e Águas',
    amount: 850.0,
    invoiceRef: 'NF-49201',
    hasInvoice: true,
    date: '2026-01-08',
  },
  {
    id: 'MER-802',
    periodId: 'per_1',
    supplier: 'Confecções Esportivas Brasil',
    description: '50 Camisetas Oficiais do Campeonato',
    amount: 1100.0,
    invoiceRef: 'NF-11849',
    hasInvoice: true,
    date: '2026-01-07',
  },
];
