import React from 'react';
import {
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Period, Sale, SaleStatus, DebtorSummary, TabId, FinancialSubTab } from '../types';
import { formatMoney, formatDateTime, formatShortDate } from '../utils/formatters';

interface DashboardViewProps {
  activePeriod: Period;
  currentPeriodSales: Sale[];
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
  buyersWithDebt: DebtorSummary[];
  totalGlobalPendingDebts: number;
  onNavigate: (tab: TabId, subTab?: FinancialSubTab) => void;
  onOpenPayDebt: (buyerName: string) => void;
  onExportCsv: () => void;
}

function renderSaleStatus(status: SaleStatus, method?: string) {
  if (status === 'Pago') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
        <span>Pago</span>
        {method && (
          <>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-normal text-slate-500">{method}</span>
          </>
        )}
      </span>
    );
  }
  if (status === 'Parcial') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <Clock size={14} className="shrink-0 text-amber-600" />
        <span>Parcial</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
      <AlertCircle size={14} className="shrink-0 text-red-600" />
      <span>Fiado</span>
    </span>
  );
}

export function DashboardView({
  activePeriod,
  currentPeriodSales,
  metrics,
  buyersWithDebt,
  totalGlobalPendingDebts,
  onNavigate,
  onOpenPayDebt,
  onExportCsv,
}: DashboardViewProps) {
  const totalCosts = metrics.totalExpenses + metrics.totalMerchandiseCost;

  return (
    <div className="space-y-6">
      {/* HEADER CONTEXT + PRIMARY ACTION */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {activePeriod.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{activePeriod.location}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {formatShortDate(activePeriod.startDate)}
              {activePeriod.endDate && activePeriod.endDate !== '-'
                ? ` até ${formatShortDate(activePeriod.endDate)}`
                : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-semibold ${
                activePeriod.status === 'Ativo'
                  ? 'text-emerald-700'
                  : 'text-slate-600'
              }`}
            >
              Evento {activePeriod.status.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0"
          >
            <Download size={14} />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('vendas')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span>Registrar venda</span>
          </button>
        </div>
      </div>

      {/* 5 KEY PLAIN-LANGUAGE INDICATORS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <span className="block text-xs font-medium text-slate-500">
            Entrou no caixa
          </span>
          <div className="font-mono text-xl font-bold tabular-nums text-emerald-700">
            {formatMoney(metrics.totalCashReceived)}
          </div>
          <p className="text-xs text-slate-500">
            Vendas pagas + fiados recebidos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <span className="block text-xs font-medium text-slate-500">
            Total vendido
          </span>
          <div className="font-mono text-xl font-bold tabular-nums text-slate-900">
            {formatMoney(metrics.grossSalesTotal)}
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {currentPeriodSales.length}{' '}
            {currentPeriodSales.length === 1 ? 'venda' : 'vendas'} neste evento
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <span className="block text-xs font-medium text-slate-500">
            Falta receber (Fiado)
          </span>
          <div className="font-mono text-xl font-bold tabular-nums text-amber-700">
            {formatMoney(metrics.periodPendingDebts)}
          </div>
          <p className="text-xs text-slate-500">Anotado para pagar depois</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5">
          <span className="block text-xs font-medium text-slate-500">
            Gastos do evento
          </span>
          <div className="font-mono text-xl font-bold tabular-nums text-red-600">
            {formatMoney(totalCosts)}
          </div>
          <p className="text-xs text-slate-500">Despesas + compras de itens</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1.5 sm:col-span-2 lg:col-span-1">
          <span className="block text-xs font-medium text-slate-500">
            Saldo do evento
          </span>
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              metrics.netCashResult >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {formatMoney(metrics.netCashResult)}
          </div>
          <p className="text-xs text-slate-500">O que sobrou no caixa</p>
        </div>
      </div>

      {/* MAIN SPLIT: RECENT SALES + OPEN FIADOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <section className="lg:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Últimas vendas
              </h2>
              <p className="text-xs text-slate-500">
                Movimentações mais recentes em {activePeriod.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('vendas')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Ir para o caixa</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Comprador</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Pago</th>
                  <th className="px-5 py-3">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {currentPeriodSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <p className="mb-3 text-xs">
                        Nenhuma venda registrada neste evento ainda. Comece
                        lançando a primeira venda no caixa.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('vendas')}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white hover:bg-[#5B3DF5] whitespace-nowrap"
                      >
                        <Plus size={15} />
                        <span>Registrar primeira venda</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentPeriodSales.slice(0, 6).map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {sale.buyerName}
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-slate-500">
                          {formatDateTime(sale.createdAt)}
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3.5 text-slate-600">
                        {sale.items
                          .map((i) => `${i.qty}x ${i.name}`)
                          .join(', ')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatMoney(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-emerald-700">
                        {formatMoney(sale.paidAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        {renderSaleStatus(sale.status, sale.paymentMethod)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* OPEN FIADOS */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-baseline justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Fiados em aberto
              </h2>
              <p className="text-xs text-slate-500">
                {buyersWithDebt.length}{' '}
                {buyersWithDebt.length === 1 ? 'pessoa' : 'pessoas'} com
                pagamento pendente
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('financeiro', 'fiados')}
              className="text-xs font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap shrink-0"
            >
              Ver todos
            </button>
          </div>

          {buyersWithDebt.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-slate-500">
              <CheckCircle2
                size={22}
                className="mx-auto mb-2 text-emerald-600"
              />
              Tudo em dia! Nenhum fiado pendente no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/80 max-h-[320px] overflow-y-auto">
              {buyersWithDebt.map((debtor) => (
                <div
                  key={debtor.buyerName}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {debtor.buyerName}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {debtor.salesList.length}{' '}
                      {debtor.salesList.length === 1
                        ? 'compra pendente'
                        : 'compras pendentes'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-bold tabular-nums text-red-600">
                      {formatMoney(debtor.totalPending)}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenPayDebt(debtor.buyerName)}
                      className="mt-0.5 text-[11px] font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap"
                    >
                      Receber
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 text-xs">
            <span className="font-medium text-slate-600">
              Total geral a receber
            </span>
            <strong className="font-mono text-sm font-bold tabular-nums text-red-600">
              {formatMoney(totalGlobalPendingDebts)}
            </strong>
          </div>
        </section>
      </div>
    </div>
  );
}
