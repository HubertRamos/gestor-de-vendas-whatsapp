import React from 'react';
import { Plus } from 'lucide-react';
import { Period, Sale } from '../types';
import { formatMoney, formatShortDate } from '../utils/formatters';

interface PeriodsViewProps {
  periods: Period[];
  activePeriodId: string;
  sales: Sale[];
  onSelectPeriod: (period: Period) => void;
  onTogglePeriodStatus: (period: Period) => void;
  onOpenNewPeriod: () => void;
}

export function PeriodsView({
  periods,
  activePeriodId,
  sales,
  onSelectPeriod,
  onTogglePeriodStatus,
  onOpenNewPeriod,
}: PeriodsViewProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Eventos e campeonatos
          </h1>
          <p className="text-xs text-slate-500">
            Cada evento separa suas vendas e gastos. Quem comprou fiado
            continua aparecendo em qualquer evento até quitar.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewPeriod}
          className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
        >
          <Plus size={15} />
          <span>Novo evento</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
            <tr>
              <th className="px-5 py-3">Evento</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Datas</th>
              <th className="px-4 py-3 text-right">Total vendido</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {periods.map((per) => {
              const isSelected = per.id === activePeriodId;
              const periodGross = sales
                .filter((s) => s.periodId === per.id)
                .reduce((acc, s) => acc + s.totalAmount, 0);

              return (
                <tr
                  key={per.id}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    isSelected ? 'bg-[#6D4AFF]/[0.04]' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {per.name}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-semibold text-[#6D4AFF]">
                          · Em uso agora
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{per.location}</td>
                  <td className="px-4 py-3.5 font-mono tabular-nums text-slate-600">
                    {formatShortDate(per.startDate)}
                    {per.endDate && per.endDate !== '-'
                      ? ` até ${formatShortDate(per.endDate)}`
                      : ''}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatMoney(periodGross)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`font-semibold ${
                        per.status === 'Ativo'
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {per.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectPeriod(per)}
                          className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#6D4AFF] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          Usar este
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onTogglePeriodStatus(per)}
                        className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        {per.status === 'Ativo' ? 'Encerrar' : 'Reabrir'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
