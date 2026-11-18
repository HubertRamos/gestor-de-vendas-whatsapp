import React, { useEffect, useState } from 'react';
import {
  X,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Product,
  DebtorSummary,
  ConfirmDialogState,
} from '../types';
import { formatMoney } from '../utils/formatters';
import { MoneyInput } from './MoneyInput';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, subtitle, onClose, children }: ModalShellProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D4AFF]"
            aria-label="Fechar janela"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const PAYMENT_METHODS = ['PIX', 'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito'];

export function PayDebtModal({
  debtor,
  activePeriodName,
  form,
  setForm,
  errorMessage,
  onClose,
  onSubmit,
}: {
  debtor: DebtorSummary;
  activePeriodName: string;
  form: { amount: string; paymentMethod: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ amount: string; paymentMethod: string }>
  >;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <ModalShell
      title="Receber pagamento de fiado"
      subtitle={debtor.buyerName}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4 p-5">
        <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-medium text-slate-600">
            Total em aberto
          </span>
          <span className="font-mono text-lg font-bold tabular-nums text-red-600">
            {formatMoney(debtor.totalPending)}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="pay-debt-amount"
              className="text-xs font-semibold text-slate-800"
            >
              Quanto está recebendo agora? <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    amount: (debtor.totalPending / 2).toFixed(2),
                  }))
                }
                className="font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap shrink-0"
              >
                Metade
              </button>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    amount: debtor.totalPending.toFixed(2),
                  }))
                }
                className="font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap shrink-0"
              >
                Tudo
              </button>
            </div>
          </div>
          <MoneyInput
            id="pay-debt-amount"
            value={form.amount}
            onChange={(val) => setForm({ ...form, amount: val })}
            hasError={Boolean(errorMessage)}
            autoFocus
          />
          {errorMessage && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errorMessage}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-800">
            Como foi pago?
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: method })}
                className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  form.paymentMethod === method
                    ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          O valor entra no caixa do evento{' '}
          <strong className="font-semibold text-slate-800">
            {activePeriodName}
          </strong>{' '}
          e abate primeiro as compras mais antigas.
        </p>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap shrink-0"
          >
            <DollarSign size={15} />
            <span>Confirmar recebimento</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function NewPeriodModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: { name: string; startDate: string; endDate: string; location: string };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      startDate: string;
      endDate: string;
      location: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState('');

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Digite um nome para identificar este evento.');
      return;
    }
    setError('');
    onSubmit(e);
  };

  return (
    <ModalShell
      title="Criar novo evento"
      subtitle="A data de início é preenchida automaticamente com hoje"
      onClose={onClose}
    >
      <form onSubmit={handleLocalSubmit} noValidate className="space-y-4 p-5">
        <div>
          <label
            htmlFor="period-name"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Nome do evento ou campeonato <span className="text-red-600">*</span>
          </label>
          <input
            id="period-name"
            type="text"
            autoFocus
            placeholder="Ex: Campeonato de Inverno 2026"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (error) setError('');
            }}
            className={`h-10 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 focus:outline-none ${
              error
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-300 focus:border-[#6D4AFF]'
            }`}
          />
          {error && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
          >
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showMore ? 'Menos opções' : 'Mais opções'}</span>
          </button>

          {showMore && (
            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="period-start"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Data de início
                  </label>
                  <input
                    id="period-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs tabular-nums text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="period-end"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Data de término
                  </label>
                  <input
                    id="period-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs tabular-nums text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="period-location"
                  className="mb-1.5 block text-xs font-semibold text-slate-800"
                >
                  Local do evento
                </label>
                <input
                  id="period-location"
                  type="text"
                  placeholder="Ex: Ginásio Municipal, Arena Central"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
          >
            Criar e usar agora
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Alimentação',
  'Vestuário',
  'Inscrições',
  'Outros',
];

export function NewProductModal({
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  form: {
    name: string;
    category: string;
    costPrice: string;
    defaultPrice: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      category: string;
      costPrice: string;
      defaultPrice: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showCost, setShowCost] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const saleNum = parseFloat(form.defaultPrice) || 0;
  const costNum = parseFloat(form.costPrice) || 0;
  const margin = saleNum - costNum;

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; price?: string } = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Informe o nome do produto.';
    }
    if (!form.defaultPrice || saleNum <= 0) {
      nextErrors.price = 'Informe o preço de venda.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSubmit(e);
  };

  return (
    <ModalShell
      title="Cadastrar produto"
      subtitle="Fica disponível na hora para lançar no caixa"
      onClose={onClose}
    >
      <form onSubmit={handleLocalSubmit} noValidate className="space-y-4 p-5">
        <div>
          <label
            htmlFor="new-prod-name"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Nome do produto <span className="text-red-600">*</span>
          </label>
          <input
            id="new-prod-name"
            type="text"
            autoFocus
            placeholder="Ex: Cerveja Lata 350ml"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`h-10 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 focus:outline-none ${
              errors.name
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-300 focus:border-[#6D4AFF]'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="new-prod-price"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Preço de venda <span className="text-red-600">*</span>
          </label>
          <MoneyInput
            id="new-prod-price"
            value={form.defaultPrice}
            onChange={(val) => {
              setForm({ ...form, defaultPrice: val });
              if (errors.price)
                setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            hasError={Boolean(errors.price)}
          />
          {errors.price && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.price}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-800">
            Categoria
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  form.category === cat
                    ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowCost(!showCost)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
          >
            {showCost ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>
              {showCost ? 'Menos opções' : 'Mais opções (custo unitário)'}
            </span>
          </button>

          {showCost && (
            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              <label
                htmlFor="new-prod-cost"
                className="block text-xs font-semibold text-slate-800"
              >
                Quanto custa cada unidade?
              </label>
              <MoneyInput
                id="new-prod-cost"
                value={form.costPrice}
                onChange={(val) => setForm({ ...form, costPrice: val })}
              />
              {saleNum > 0 && (
                <p className="text-xs text-slate-600">
                  Ganho estimado por unidade:{' '}
                  <strong
                    className={`font-mono font-semibold tabular-nums ${
                      margin >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {formatMoney(margin)}
                  </strong>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
          >
            Salvar produto
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function EditProductModal({
  product,
  setProduct,
  onClose,
  onSubmit,
}: {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showCost, setShowCost] = useState(product.costPrice > 0);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const margin = product.defaultPrice - product.costPrice;

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; price?: string } = {};
    if (!product.name.trim()) {
      nextErrors.name = 'Informe o nome do produto.';
    }
    if (product.defaultPrice <= 0) {
      nextErrors.price = 'Informe o preço de venda.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSubmit(e);
  };

  return (
    <ModalShell
      title="Editar produto"
      subtitle="Atualize o nome, categoria ou preço"
      onClose={onClose}
    >
      <form onSubmit={handleLocalSubmit} noValidate className="space-y-4 p-5">
        <div>
          <label
            htmlFor="edit-prod-name"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Nome do produto <span className="text-red-600">*</span>
          </label>
          <input
            id="edit-prod-name"
            type="text"
            value={product.name}
            onChange={(e) => {
              setProduct({ ...product, name: e.target.value });
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`h-10 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 focus:outline-none ${
              errors.name
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-300 focus:border-[#6D4AFF]'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-prod-price"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Preço de venda <span className="text-red-600">*</span>
          </label>
          <MoneyInput
            id="edit-prod-price"
            value={product.defaultPrice > 0 ? product.defaultPrice.toFixed(2) : ''}
            onChange={(val) => {
              setProduct({
                ...product,
                defaultPrice: parseFloat(val) || 0,
              });
              if (errors.price)
                setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            hasError={Boolean(errors.price)}
          />
          {errors.price && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errors.price}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-800">
            Categoria
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setProduct({ ...product, category: cat })}
                className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  product.category === cat
                    ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowCost(!showCost)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
          >
            {showCost ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>
              {showCost ? 'Menos opções' : 'Mais opções (custo unitário)'}
            </span>
          </button>

          {showCost && (
            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              <label
                htmlFor="edit-prod-cost"
                className="block text-xs font-semibold text-slate-800"
              >
                Quanto custa cada unidade?
              </label>
              <MoneyInput
                id="edit-prod-cost"
                value={product.costPrice > 0 ? product.costPrice.toFixed(2) : ''}
                onChange={(val) =>
                  setProduct({
                    ...product,
                    costPrice: parseFloat(val) || 0,
                  })
                }
              />
              <p className="text-xs text-slate-600">
                Ganho estimado por unidade:{' '}
                <strong
                  className={`font-mono font-semibold tabular-nums ${
                    margin >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {formatMoney(margin)}
                </strong>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const EXPENSE_CATEGORIES = [
  'Infraestrutura',
  'Alimentação',
  'Transporte',
  'Taxas',
  'Outros',
];

function inferExpenseCategory(text: string): string | null {
  const lower = text.toLowerCase();
  if (/(gelo|agua|água|lanche|cafe|café|comida|refeiç|almoço|janta|bebida)/.test(lower)) {
    return 'Alimentação';
  }
  if (/(uber|frete|combust|gasolina|etanol|diesel|carro|moto|estacion|pedagio|pedágio)/.test(lower)) {
    return 'Transporte';
  }
  if (/(taxa|maquininha|cartao|cartão|tarifa|banco|alvara|alvará|pix|juro)/.test(lower)) {
    return 'Taxas';
  }
  if (/(tenda|som|mesa|cadeira|limpeza|energia|luz|palco|estrutura|gerador|seguran)/.test(lower)) {
    return 'Infraestrutura';
  }
  return null;
}

export function NewExpenseModal({
  form,
  setForm,
  recurringDescriptions = [],
  onClose,
  onSubmit,
}: {
  form: { description: string; category: string; amount: string; date: string };
  setForm: React.Dispatch<
    React.SetStateAction<{
      description: string;
      category: string;
      amount: string;
      date: string;
    }>
  >;
  recurringDescriptions?: string[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [manualCategory, setManualCategory] = useState(false);
  const [amountError, setAmountError] = useState('');

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || (parseFloat(form.amount) || 0) <= 0) {
      setAmountError('Informe o valor pago.');
      return;
    }
    setAmountError('');
    onSubmit(e);
  };

  return (
    <ModalShell
      title="Lançar despesa"
      subtitle="Data e categoria recorrente já vêm preenchidas"
      onClose={onClose}
    >
      <form onSubmit={handleLocalSubmit} noValidate className="space-y-4 p-5">
        <div>
          <label
            htmlFor="exp-amount"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Valor gasto <span className="text-red-600">*</span>
          </label>
          <MoneyInput
            id="exp-amount"
            autoFocus
            value={form.amount}
            onChange={(val) => {
              setForm({ ...form, amount: val });
              if (amountError) setAmountError('');
            }}
            hasError={Boolean(amountError)}
          />
          {amountError && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {amountError}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-800">
            Categoria
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setManualCategory(true);
                  setForm({ ...form, category: cat });
                }}
                className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                  form.category === cat
                    ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="exp-desc"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Descrição (opcional)
          </label>
          <input
            id="exp-desc"
            type="text"
            list="recurring-expense-list"
            placeholder={`Se vazio, salva como Gasto com ${form.category}`}
            value={form.description}
            onChange={(e) => {
              const nextDesc = e.target.value;
              const inferred = !manualCategory
                ? inferExpenseCategory(nextDesc)
                : null;
              setForm({
                ...form,
                description: nextDesc,
                category: inferred || form.category,
              });
            }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
          />
          {recurringDescriptions.length > 0 && (
            <datalist id="recurring-expense-list">
              {recurringDescriptions.map((desc) => (
                <option key={desc} value={desc} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
          >
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showMore ? 'Menos opções' : 'Mais opções'}</span>
          </button>

          {showMore && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <label
                htmlFor="exp-date"
                className="mb-1.5 block text-xs font-semibold text-slate-800"
              >
                Data do pagamento
              </label>
              <input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs tabular-nums text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
          >
            Salvar despesa
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function NewMerchandiseModal({
  form,
  setForm,
  knownSuppliers = [],
  onClose,
  onSubmit,
}: {
  form: {
    supplier: string;
    description: string;
    amount: string;
    invoiceRef: string;
    hasInvoice: boolean;
    date: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      supplier: string;
      description: string;
      amount: string;
      invoiceRef: string;
      hasInvoice: boolean;
      date: string;
    }>
  >;
  knownSuppliers?: string[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [amountError, setAmountError] = useState('');

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || (parseFloat(form.amount) || 0) <= 0) {
      setAmountError('Informe o valor total da compra.');
      return;
    }
    setAmountError('');
    onSubmit(e);
  };

  return (
    <ModalShell
      title="Registrar compra de mercadoria"
      subtitle="Data preenchida automaticamente com hoje"
      onClose={onClose}
    >
      <form onSubmit={handleLocalSubmit} noValidate className="space-y-4 p-5">
        <div>
          <label
            htmlFor="mer-amount"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            Valor total pago <span className="text-red-600">*</span>
          </label>
          <MoneyInput
            id="mer-amount"
            autoFocus
            value={form.amount}
            onChange={(val) => {
              setForm({ ...form, amount: val });
              if (amountError) setAmountError('');
            }}
            hasError={Boolean(amountError)}
          />
          {amountError && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {amountError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="mer-desc"
            className="mb-1.5 block text-xs font-semibold text-slate-800"
          >
            O que foi comprado? (opcional)
          </label>
          <input
            id="mer-desc"
            type="text"
            placeholder="Ex: 10 sacos de gelo + 20 fardos de água"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
          >
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showMore ? 'Menos opções' : 'Mais opções'}</span>
          </button>

          {showMore && (
            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
              <div>
                <label
                  htmlFor="mer-supplier"
                  className="mb-1.5 block text-xs font-semibold text-slate-800"
                >
                  Fornecedor ou mercado
                </label>
                <input
                  id="mer-supplier"
                  type="text"
                  list="known-suppliers-list"
                  placeholder="Ex: Distribuidora de Bebidas Geladas"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                />
                {knownSuppliers.length > 0 && (
                  <datalist id="known-suppliers-list">
                    {knownSuppliers.map((sup) => (
                      <option key={sup} value={sup} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="mer-nf"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Referência de nota fiscal
                  </label>
                  <input
                    id="mer-nf"
                    type="text"
                    placeholder="Ex: NF-10948"
                    value={form.invoiceRef}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        invoiceRef: val,
                        hasInvoice: val.trim().length > 0,
                      });
                    }}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mer-date"
                    className="mb-1.5 block text-xs font-semibold text-slate-800"
                  >
                    Data da compra
                  </label>
                  <input
                    id="mer-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs tabular-nums text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap shrink-0"
          >
            Registrar compra
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ConfirmDeleteModal({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState;
  onClose: () => void;
}) {
  return (
    <ModalShell title={dialog.title} onClose={onClose}>
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-xs leading-relaxed text-slate-600">
            {dialog.description}
          </p>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.onConfirm();
              onClose();
            }}
            className="h-10 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-700 whitespace-nowrap shrink-0"
          >
            {dialog.confirmLabel || 'Sim, remover'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
