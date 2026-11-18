import {
  Period,
  Sale,
  Expense,
  Merchandise,
  DebtPayment,
} from '../types';

export const formatMoney = (val: number | undefined | null): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);

export const formatDateTime = (isoStr: string | undefined): string => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
};

export const formatShortDate = (dateStr: string | undefined): string => {
  if (!dateStr || dateStr === '-') return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export function exportPeriodReportCsv(params: {
  period: Period;
  sales: Sale[];
  expenses: Expense[];
  merchandise: Merchandise[];
  debtPayments: DebtPayment[];
  metrics: {
    grossSalesTotal: number;
    totalCashReceived: number;
    directCashFromSales: number;
    debtCashReceivedThisPeriod: number;
    periodPendingDebts: number;
    totalExpenses: number;
    totalMerchandiseCost: number;
    netCashResult: number;
  };
}): void {
  const { period, sales, expenses, merchandise, debtPayments, metrics } = params;
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[][] = [
    ['RELATORIO FINANCEIRO DO EVENTO', period.name],
    ['Local', period.location],
    ['Periodo', `${period.startDate} ate ${period.endDate}`],
    ['Status', period.status],
    [],
    ['INDICADOR', 'VALOR (BRL)'],
    ['Faturamento Bruto (Vendas)', metrics.grossSalesTotal.toFixed(2)],
    ['Entradas Diretas de Vendas', metrics.directCashFromSales.toFixed(2)],
    ['Fiados Quitados no Periodo', metrics.debtCashReceivedThisPeriod.toFixed(2)],
    ['Total Efetivo em Caixa', metrics.totalCashReceived.toFixed(2)],
    ['Fiados Pendentes Deste Evento', metrics.periodPendingDebts.toFixed(2)],
    ['Despesas Operacionais', metrics.totalExpenses.toFixed(2)],
    ['Compras de Mercadorias', metrics.totalMerchandiseCost.toFixed(2)],
    ['Resultado Liquido do Caixa', metrics.netCashResult.toFixed(2)],
    [],
    ['VENDAS DO PERIODO'],
    ['ID', 'Data/Hora', 'Comprador', 'Itens', 'Total', 'Pago', 'Pendente', 'Meio', 'Status'],
    ...sales.map((s) => [
      s.id,
      formatDateTime(s.createdAt),
      s.buyerName,
      s.items.map((i) => `${i.qty}x ${i.name}`).join(' | '),
      s.totalAmount.toFixed(2),
      s.paidAmount.toFixed(2),
      s.pendingAmount.toFixed(2),
      s.paymentMethod,
      s.status,
    ]),
    [],
    ['QUITACOES DE FIADO RECEBIDAS NO PERIODO'],
    ['ID', 'Data/Hora', 'Comprador', 'Venda Ref.', 'Meio', 'Valor Recebido'],
    ...debtPayments.map((dp) => [
      dp.id,
      formatDateTime(dp.createdAt),
      dp.buyerName,
      dp.saleId,
      dp.paymentMethod,
      dp.amount.toFixed(2),
    ]),
    [],
    ['DESPESAS OPERACIONAIS'],
    ['ID', 'Data', 'Descricao', 'Categoria', 'Valor'],
    ...expenses.map((e) => [
      e.id,
      e.date,
      e.description,
      e.category,
      e.amount.toFixed(2),
    ]),
    [],
    ['COMPRAS DE MERCADORIAS'],
    ['ID', 'Data', 'Fornecedor', 'Descricao', 'Nota/Recibo', 'Valor'],
    ...merchandise.map((m) => [
      m.id,
      m.date,
      m.supplier,
      m.description,
      m.invoiceRef,
      m.amount.toFixed(2),
    ]),
  ];

  const csvContent =
    '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = period.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  link.href = url;
  link.setAttribute('download', `eventsales-${slug || 'relatorio'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
