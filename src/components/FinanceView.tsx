import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  DollarSign,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Period,
  Expense,
  Merchandise,
  DebtPayment,
  DebtorSummary,
  FinancialSubTab,
} from '../types';
import {
  formatMoney,
  formatDateTime,
  formatShortDate,
} from '../utils/formatters';

interface FinanceViewProps {
  activePeriod: Period;
  subTab: FinancialSubTab;
  onChangeSubTab: (tab: FinancialSubTab) => void;
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
  currentPeriodExpenses: Expense[];
  currentPeriodMerchandise: Merchandise[];
  currentPeriodDebtPayments: DebtPayment[];
  buyersWithDebt: DebtorSummary[];
  periodNameById: Record<string, string>;
  onOpenNewExpense: () => void;
  onOpenNewMerchandise: () => void;
  onOpenPayDebt: (buyerName: string) => void;
  onRequestDeleteExpense: (exp: Expense) => void;
  onRequestDeleteMerchandise: (mer: Merchandise) => void;
}

export function FinanceView({
  activePeriod,
  subTab,
  onChangeSubTab,
  metrics,
  currentPeriodExpenses,
  currentPeriodMerchandise,
  currentPeriodDebtPayments,
  buyersWithDebt,
  periodNameById,
  onOpenNewExpense,
  onOpenNewMerchandise,
  onOpenPayDebt,
  onRequestDeleteExpense,
  onRequestDeleteMerchandise,
}: FinanceViewProps) {
  const [debtSearch, setDebtSearch] = useState('');
  const [expandedDebtor, setExpandedDebtor] = useState<string | null>(null);

  const totalOut = metrics.totalExpenses + metrics.totalMerchandiseCost;

  const filteredDebtors = buyersWithDebt.filter((b) =>
    b.buyerName.toLowerCase().includes(debtSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CLEAN SUB-TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex overflow-x-auto space-x-6">
          {(
            [
              { id: 'resumo', label: 'Resumo do caixa' },
              {
                id: 'fiados',
                label: `Fiados a receber (${buyersWithDebt.length})`,
              },
              {
                id: 'despesas',
                label: `Despesas (${currentPeriodExpenses.length})`,
              },
              {
                id: 'compras',
                label: `Compras (${currentPeriodMerchandise.length})`,
              },
            ] as { id: FinancialSubTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeSubTab(tab.id)}
              className={`pb-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                subTab === tab.id
                  ? 'border-[#6D4AFF] text-[#6D4AFF]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* SUB-TAB 1: RESUMO DO CAIXA */}
      {subTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Vendas recebidas na hora
              </span>
              <div className="font-mono text-lg font-bold tabular-nums text-emerald-700">
                {formatMoney(metrics.directCashFromSales)}
              </div>
              <p className="text-xs text-slate-500">
                PIX, dinheiro e cartão no ato
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Fiados pagos neste evento
              </span>
              <div className="font-mono text-lg font-bold tabular-nums text-emerald-700">
                {formatMoney(metrics.debtCashReceivedThisPeriod)}
              </div>
              <p className="text-xs text-slate-500">
                Dívidas quitadas durante o evento
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Tudo que saiu
              </span>
              <div className="font-mono text-lg font-bold tabular-nums text-red-600">
                {formatMoney(totalOut)}
              </div>
              <p className="text-xs text-slate-500">
                Despesas + compras de mercadorias
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Sobrou no caixa
              </span>
              <div
                className={`font-mono text-lg font-bold tabular-nums ${
                  metrics.netCashResult >= 0
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                {formatMoney(metrics.netCashResult)}
              </div>
              <p className="text-xs text-slate-500">
                Dinheiro real após pagar os gastos
              </p>
            </div>
          </div>

          {/* SIMPLE BREAKDOWN */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Fechamento de {activePeriod.name}
              </h2>
              <p className="text-xs text-slate-500">
                Entenda passo a passo de onde veio e para onde foi o dinheiro
              </p>
            </div>

            <div className="divide-y divide-slate-200/80 px-5 text-xs">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-slate-700">
                  Total vendido no evento (incluindo vendas no fiado)
                </span>
                <strong className="font-mono font-semibold tabular-nums text-slate-900">
                  {formatMoney(metrics.grossSalesTotal)}
                </strong>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="pl-3 text-slate-500">
                  Ainda falta receber (fiados deste evento em aberto)
                </span>
                <span className="font-mono font-semibold tabular-nums text-amber-700">
                  − {formatMoney(metrics.periodPendingDebts)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="pl-3 text-slate-500">
                  Fiados que foram pagos depois e entraram no caixa
                </span>
                <span className="font-mono font-semibold tabular-nums text-emerald-700">
                  + {formatMoney(metrics.debtCashReceivedThisPeriod)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50/80 -mx-5 px-5 py-3.5 font-semibold text-slate-900">
                <span>Total que realmente entrou no caixa</span>
                <span className="font-mono tabular-nums text-emerald-700">
                  {formatMoney(metrics.totalCashReceived)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-slate-700">
                  Despesas do evento (estrutura, equipe, taxas)
                </span>
                <span className="font-mono font-semibold tabular-nums text-red-600">
                  − {formatMoney(metrics.totalExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <span className="text-slate-700">
                  Compras de mercadorias (bebidas, comidas, itens)
                </span>
                <span className="font-mono font-semibold tabular-nums text-red-600">
                  − {formatMoney(metrics.totalMerchandiseCost)}
                </span>
              </div>
              <div className="flex items-center justify-between py-4 text-sm font-bold text-slate-900">
                <span>Saldo final em caixa</span>
                <span
                  className={`font-mono text-base tabular-nums ${
                    metrics.netCashResult >= 0
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}
                >
                  {formatMoney(metrics.netCashResult)}
                </span>
              </div>
            </div>
          </div>

          {/* FIADO REPAYMENTS IN THIS PERIOD */}
          {currentPeriodDebtPayments.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Fiados recebidos durante este evento
                </h3>
                <p className="text-xs text-slate-500">
                  Pagamentos recebidos que já estão somados no caixa acima
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Quando</th>
                      <th className="px-4 py-3">Quem pagou</th>
                      <th className="px-4 py-3">Forma</th>
                      <th className="px-5 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {currentPeriodDebtPayments.map((dp) => (
                      <tr key={dp.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-mono tabular-nums text-slate-500">
                          {formatDateTime(dp.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {dp.buyerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {dp.paymentMethod}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-emerald-700">
                          + {formatMoney(dp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: FIADOS A RECEBER */}
      {subTab === 'fiados' && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Fiados a receber
              </h2>
              <p className="text-xs text-slate-500">
                Valores pendentes somados de todos os eventos por pessoa
              </p>
            </div>

            {buyersWithDebt.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={debtSearch}
                  onChange={(e) => setDebtSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                />
              </div>
            )}
          </div>

          {buyersWithDebt.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-xs text-slate-500">
              <CheckCircle2
                size={28}
                className="mx-auto mb-2 text-emerald-600"
              />
              Tudo quitado! Nenhuma pessoa tem compras fiadas em aberto.
            </div>
          ) : filteredDebtors.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-xs text-slate-500">
              Nenhuma pessoa encontrada com esse nome.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredDebtors.map((debtor) => {
                const isExpanded = expandedDebtor === debtor.buyerName;
                return (
                  <div
                    key={debtor.buyerName}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {debtor.buyerName}
                          </h3>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {debtor.salesList.length}{' '}
                            {debtor.salesList.length === 1
                              ? 'compra pendente'
                              : 'compras pendentes'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] font-medium text-slate-500">
                            Deve no total
                          </span>
                          <span className="font-mono text-base font-bold tabular-nums text-red-600">
                            {formatMoney(debtor.totalPending)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDebtor(
                            isExpanded ? null : debtor.buyerName
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        <span>
                          {isExpanded
                            ? 'Ocultar compras em aberto'
                            : 'Ver detalhes das compras'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-slate-200/80 border-t border-slate-200 pt-1 max-h-48 overflow-y-auto">
                          {debtor.salesList.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between gap-2 py-2.5 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-800">
                                  {periodNameById[s.periodId] || 'Evento'} ·{' '}
                                  {formatDateTime(s.createdAt)}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  {s.items
                                    .map((i) => `${i.qty}x ${i.name}`)
                                    .join(', ')}
                                </p>
                              </div>
                              <div className="text-right shrink-0 font-mono tabular-nums">
                                <span className="font-semibold text-red-600">
                                  {formatMoney(s.pendingAmount)}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                  de {formatMoney(s.totalAmount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenPayDebt(debtor.buyerName)}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                    >
                      <DollarSign size={15} />
                      <span>Receber pagamento</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: DESPESAS */}
      {subTab === 'despesas' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Despesas de {activePeriod.name}
              </h2>
              <p className="text-xs text-slate-500">
                Gastos com estrutura, equipe, transporte e taxas
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewExpense}
              className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-3.5 text-xs font-semibold text-white hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>Lançar despesa</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">O que foi pago</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {currentPeriodExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <p className="mb-3">
                        Nenhuma despesa registrada neste evento ainda.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewExpense}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white whitespace-nowrap"
                      >
                        <Plus size={14} />
                        <span>Lançar primeira despesa</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentPeriodExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {exp.description}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {exp.category}
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-500">
                        {formatShortDate(exp.date)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-red-600">
                        − {formatMoney(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onRequestDeleteExpense(exp)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remover despesa ${exp.description}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-TAB 4: COMPRAS DE MERCADORIAS */}
      {subTab === 'compras' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Compras de mercadorias
              </h2>
              <p className="text-xs text-slate-500">
                Bebidas, alimentos e itens comprados para vender no evento
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewMerchandise}
              className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-3.5 text-xs font-semibold text-white hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>Registrar compra</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">O que foi comprado</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Nota / Recibo</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {currentPeriodMerchandise.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <p className="mb-3">
                        Nenhuma compra de mercadoria lançada neste evento.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenNewMerchandise}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white whitespace-nowrap"
                      >
                        <Plus size={14} />
                        <span>Registrar primeira compra</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentPeriodMerchandise.map((mer) => (
                    <tr
                      key={mer.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {mer.description}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {mer.supplier}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-xs ${
                            mer.hasInvoice && mer.invoiceRef !== 'S/N'
                              ? 'font-medium text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          <Paperclip size={12} />
                          <span>{mer.invoiceRef || '—'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono tabular-nums text-slate-500">
                        {formatShortDate(mer.date)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-red-600">
                        − {formatMoney(mer.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onRequestDeleteMerchandise(mer)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remover compra ${mer.description}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
