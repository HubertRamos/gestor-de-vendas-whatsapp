import React, { useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  SlidersHorizontal,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Period,
  Product,
  CartItem,
  Sale,
  SaleStatus,
  SalePaymentType,
} from '../types';
import { formatMoney, formatDateTime } from '../utils/formatters';
import { MoneyInput } from './MoneyInput';

interface SalesViewProps {
  activePeriod: Period;
  products: Product[];
  currentPeriodSales: Sale[];
  knownBuyers: string[];
  onRegisterSale: (params: {
    buyerName: string;
    items: CartItem[];
    paymentType: SalePaymentType;
    paidNow: number;
    paymentMethod: string;
  }) => void;
  onOpenPayDebt: (buyerName: string) => void;
  onRequestDeleteSale: (sale: Sale) => void;
  onNavigateToProducts: () => void;
}

const PAYMENT_METHODS = [
  { id: 'PIX', label: 'PIX' },
  { id: 'Dinheiro', label: 'Dinheiro' },
  { id: 'Cartão de Débito', label: 'Débito' },
  { id: 'Cartão de Crédito', label: 'Crédito' },
];

const DEFAULT_METHOD_IDS = new Set(PAYMENT_METHODS.map((m) => m.id));

function renderSaleStatus(status: SaleStatus) {
  if (status === 'Pago') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
        <span>Pago</span>
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

export function SalesView({
  activePeriod,
  products,
  currentPeriodSales,
  knownBuyers,
  onRegisterSale,
  onOpenPayDebt,
  onRequestDeleteSale,
  onNavigateToProducts,
}: SalesViewProps) {
  // Determine most common direct payment method from recent sales (default: PIX)
  const preferredPaymentMethod = useMemo(() => {
    const counts: Record<string, number> = {};
    currentPeriodSales.forEach((s) => {
      if (DEFAULT_METHOD_IDS.has(s.paymentMethod)) {
        counts[s.paymentMethod] = (counts[s.paymentMethod] || 0) + 1;
      }
    });
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] || 'PIX';
  }, [currentPeriodSales]);

  // --- POS FLOW STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('Todos');

  const [paymentType, setPaymentType] = useState<SalePaymentType>('A_VISTA');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paidNowStr, setPaidNowStr] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const [errors, setErrors] = useState<{
    paidNow?: string;
    buyer?: string;
  }>({});

  const activePaymentMethod = paymentMethod || preferredPaymentMethod;

  // --- HISTORY FILTER STATE ---
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<
    'TODOS' | SaleStatus
  >('TODOS');
  const [showFilters, setShowFilters] = useState(false);

  // --- DERIVED CATALOG ---
  const categories = useMemo(() => {
    const set = new Set<string>(['Todos']);
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        catalogCategory === 'Todos' || p.category === catalogCategory;
      const matchText =
        !catalogSearch.trim() ||
        p.name.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchText;
    });
  }, [products, catalogCategory, catalogSearch]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty * item.unitPrice, 0),
    [cart]
  );

  const paidNowNum = parseFloat(paidNowStr) || 0;
  const remainingFiado = Math.max(0, Number((cartTotal - paidNowNum).toFixed(2)));

  // --- FILTERED HISTORY ---
  const filteredSales = useMemo(() => {
    return currentPeriodSales.filter((s) => {
      const q = salesSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        s.buyerName.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q));
      const matchesStatus =
        salesStatusFilter === 'TODOS' || s.status === salesStatusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [currentPeriodSales, salesSearch, salesStatusFilter]);

  // --- CART HANDLERS ---
  const handleAddProduct = (prod: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx >= 0) {
        return prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          qty: 1,
          unitPrice: prod.defaultPrice,
        },
      ];
    });
  };

  const handleQtyDelta = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, qty: item.qty + delta }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleUpdateUnitPrice = (productId: string, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, unitPrice: num } : item
      )
    );
  };

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const nextErrors: { paidNow?: string; buyer?: string } = {};

    const needsBuyer = paymentType === 'FIADO' || paymentType === 'PARCIAL';
    if (needsBuyer && !buyerName.trim()) {
      nextErrors.buyer =
        'Informe o nome de quem está comprando para anotar o fiado.';
    }

    if (paymentType === 'PARCIAL') {
      if (paidNowNum <= 0) {
        nextErrors.paidNow =
          'Informe quanto o cliente pagou agora (ou mude para Fiado).';
      } else if (paidNowNum >= cartTotal && cartTotal > 0) {
        nextErrors.paidNow =
          'Valor igual ou maior que o total. Escolha "À vista" para pagamento completo.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const finalBuyer = buyerName.trim() || 'Venda avulsa';

    onRegisterSale({
      buyerName: finalBuyer,
      items: cart,
      paymentType,
      paidNow: paidNowNum,
      paymentMethod: activePaymentMethod,
    });

    // Reset form cleanly for next customer
    setCart([]);
    setEditingPriceId(null);
    setPaymentType('A_VISTA');
    setPaymentMethod(null);
    setPaidNowStr('');
    setBuyerName('');
    setShowMoreOptions(false);
    setErrors({});
  };

  const getCartQty = (productId: string) =>
    cart.find((c) => c.productId === productId)?.qty || 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* PRIMARY ACTION: NOVA VENDA (STEP-BY-STEP) */}
      <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-baseline justify-between border-b border-slate-200 pb-3.5">
          <div>
            <h1 className="text-base font-bold text-slate-900">Nova venda</h1>
            <p className="text-xs text-slate-500">
              Toque nos produtos para montar o pedido
            </p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCart([]);
                setEditingPriceId(null);
                setErrors({});
              }}
              className="text-xs font-medium text-slate-500 hover:text-red-600 whitespace-nowrap"
            >
              Limpar pedido
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitSale} noValidate className="space-y-5">
          {/* STEP 1: SELECT PRODUCTS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                1. Produtos
              </span>
              {products.length > 6 && (
                <div className="relative w-44">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs text-slate-900 focus:border-[#6D4AFF] focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {products.length > 4 && (
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    className={`h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      catalogCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {products.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                <p className="mb-2">Nenhum produto cadastrado ainda.</p>
                <button
                  type="button"
                  onClick={onNavigateToProducts}
                  className="font-semibold text-[#6D4AFF] hover:underline"
                >
                  Cadastrar primeiro produto
                </button>
              </div>
            ) : visibleProducts.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">
                Nenhum produto encontrado nessa busca.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {visibleProducts.map((prod) => {
                  const qtyInCart = getCartQty(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className={`flex flex-col items-start justify-between rounded-lg border p-2.5 text-left transition-colors ${
                        qtyInCart > 0
                          ? 'border-[#6D4AFF] bg-[#6D4AFF]/[0.05]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-1">
                        <span className="line-clamp-1 text-xs font-semibold text-slate-900">
                          {prod.name}
                        </span>
                        {qtyInCart > 0 && (
                          <span className="font-mono text-[11px] font-bold tabular-nums text-[#6D4AFF] shrink-0">
                            {qtyInCart}x
                          </span>
                        )}
                      </div>
                      <span className="mt-1 font-mono text-xs font-medium tabular-nums text-slate-600">
                        {formatMoney(prod.defaultPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-center text-xs text-slate-500">
              Selecione um ou mais produtos acima para conferir o total e
              finalizar a venda.
            </div>
          ) : (
            <>
              {/* STEP 2: SELECTED ITEMS */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <span className="block text-xs font-semibold text-slate-800">
                  2. Itens selecionados
                </span>
                <div className="divide-y divide-slate-200/80 border-y border-slate-200 max-h-60 overflow-y-auto">
                  {cart.map((item) => {
                    const isEditingPrice = editingPriceId === item.productId;
                    return (
                      <div key={item.productId} className="py-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingPriceId(
                                  isEditingPrice ? null : item.productId
                                )
                              }
                              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-[#6D4AFF]"
                            >
                              <span className="font-mono tabular-nums">
                                {formatMoney(item.unitPrice)} cada
                              </span>
                              <Edit3 size={11} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQtyDelta(item.productId, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                              aria-label={`Diminuir ${item.name}`}
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-bold tabular-nums text-slate-900">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyDelta(item.productId, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                              aria-label={`Aumentar ${item.name}`}
                            >
                              <Plus size={13} />
                            </button>
                            <span className="ml-1.5 w-16 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                              {formatMoney(item.qty * item.unitPrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQtyDelta(item.productId, -item.qty)
                              }
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isEditingPrice && (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-2.5 py-2">
                            <span className="text-[11px] font-medium text-slate-600">
                              Novo preço unitário:
                            </span>
                            <MoneyInput
                              value={
                                item.unitPrice > 0
                                  ? item.unitPrice.toFixed(2)
                                  : ''
                              }
                              onChange={(val) =>
                                handleUpdateUnitPrice(item.productId, val)
                              }
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: TOTAL & PAYMENT WITH DEFAULT SELECTORS */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Total do pedido
                  </span>
                  <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                    {formatMoney(cartTotal)}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-800">
                    3. Pagamento
                  </span>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('A_VISTA');
                        setErrors({});
                      }}
                      className={`h-9 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        paymentType === 'A_VISTA'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      À vista
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('PARCIAL');
                        setErrors((prev) => ({ ...prev, paidNow: undefined }));
                      }}
                      className={`h-9 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        paymentType === 'PARCIAL'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Parcial
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('FIADO');
                        setErrors((prev) => ({ ...prev, paidNow: undefined }));
                      }}
                      className={`h-9 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        paymentType === 'FIADO'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Fiado
                    </button>
                  </div>
                </div>

                {/* DEFAULT QUICK SELECTORS FOR MOST COMMON PAYMENT METHODS */}
                {paymentType !== 'FIADO' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        Forma de pagamento
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Padrão: {preferredPaymentMethod}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`h-9 rounded-lg border px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                            activePaymentMethod === pm.id
                              ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONDITIONAL: PARTIAL AMOUNT WITH QUICK PRESET BUTTONS */}
                {paymentType === 'PARCIAL' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="sale-paid-now"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Pago agora <span className="text-red-600">*</span>
                      </label>
                      {cartTotal > 0 && (
                        <div className="flex items-center gap-2 text-[11px]">
                          {[
                            { label: '25%', factor: 0.25 },
                            { label: 'Metade', factor: 0.5 },
                            { label: '75%', factor: 0.75 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setPaidNowStr(
                                  (cartTotal * preset.factor).toFixed(2)
                                );
                                setErrors((prev) => ({
                                  ...prev,
                                  paidNow: undefined,
                                }));
                              }}
                              className="font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <MoneyInput
                      id="sale-paid-now"
                      value={paidNowStr}
                      onChange={(val) => {
                        setPaidNowStr(val);
                        if (errors.paidNow)
                          setErrors((prev) => ({
                            ...prev,
                            paidNow: undefined,
                          }));
                      }}
                      hasError={Boolean(errors.paidNow)}
                    />
                    {errors.paidNow && (
                      <p className="text-xs font-medium text-red-600">
                        {errors.paidNow}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">
                      Vai ficar pendente no fiado:{' '}
                      <strong className="font-mono font-bold tabular-nums text-red-600">
                        {formatMoney(remainingFiado)}
                      </strong>
                    </p>
                  </div>
                )}

                {/* BUYER NAME: REQUIRED FOR PARCIAL/FIADO, HIDDEN UNDER "MAIS OPÇÕES" FOR À VISTA */}
                {paymentType !== 'A_VISTA' ? (
                  <div>
                    <label
                      htmlFor="buyer-input"
                      className="mb-1.5 block text-xs font-semibold text-slate-800"
                    >
                      Quem vai pagar depois?{' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="buyer-input"
                      list="known-buyers-list"
                      type="text"
                      placeholder="Ex: Lucas, Time Águia, Carlos Eduardo"
                      value={buyerName}
                      onChange={(e) => {
                        setBuyerName(e.target.value);
                        if (errors.buyer)
                          setErrors((prev) => ({ ...prev, buyer: undefined }));
                      }}
                      className={`h-10 w-full rounded-lg border bg-white px-3 text-xs text-slate-900 focus:outline-none ${
                        errors.buyer
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-slate-300 focus:border-[#6D4AFF]'
                      }`}
                    />
                    {errors.buyer && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.buyer}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6D4AFF] hover:underline"
                    >
                      {showMoreOptions ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      <span>
                        {showMoreOptions ? 'Menos opções' : 'Mais opções'}
                      </span>
                    </button>

                    {showMoreOptions && (
                      <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                        <label
                          htmlFor="buyer-input"
                          className="block text-xs font-semibold text-slate-800"
                        >
                          Nome do comprador (opcional)
                        </label>
                        <input
                          id="buyer-input"
                          list="known-buyers-list"
                          type="text"
                          placeholder="Se vazio, registra como Venda avulsa"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                <datalist id="known-buyers-list">
                  {knownBuyers.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#5B3DF5] whitespace-nowrap"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {paymentType === 'FIADO'
                      ? `Anotar fiado · ${formatMoney(cartTotal)}`
                      : `Confirmar venda · ${formatMoney(cartTotal)}`}
                  </span>
                </button>
              </div>
            </>
          )}
        </form>
      </section>

      {/* SECONDARY: SALES HISTORY */}
      <section className="lg:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5 space-y-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Vendas deste evento
              </h2>
              <p className="text-xs text-slate-500">
                {currentPeriodSales.length}{' '}
                {currentPeriodSales.length === 1
                  ? 'venda registrada'
                  : 'vendas registradas'}{' '}
                em {activePeriod.name}
              </p>
            </div>

            {currentPeriodSales.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search
                    size={14}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar comprador ou item..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    showFilters || salesStatusFilter !== 'TODOS'
                      ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 text-[#5B3DF5]'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  <span>Filtrar</span>
                </button>
              </div>
            )}
          </div>

          {showFilters && currentPeriodSales.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
              {(['TODOS', 'Pago', 'Parcial', 'Fiado'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSalesStatusFilter(st)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    salesStatusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'TODOS' ? 'Todas' : st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">Comprador</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Pago</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    {currentPeriodSales.length === 0
                      ? 'Nenhuma venda registrada neste evento. Use o painel ao lado para lançar a primeira.'
                      : 'Nenhuma venda encontrada para os filtros escolhidos.'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
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
                    <td
                      className="max-w-[180px] truncate px-4 py-3.5 text-slate-600"
                      title={sale.items
                        .map((i) => `${i.qty}x ${i.name}`)
                        .join(', ')}
                    >
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
                    <td className="px-4 py-3.5">
                      {renderSaleStatus(sale.status)}
                      {sale.pendingAmount > 0 && (
                        <div className="mt-0.5 font-mono text-[11px] tabular-nums text-red-600">
                          Falta {formatMoney(sale.pendingAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {sale.pendingAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenPayDebt(sale.buyerName)}
                            className="text-xs font-semibold text-[#6D4AFF] hover:underline whitespace-nowrap"
                          >
                            Receber
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRequestDeleteSale(sale)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir venda"
                          aria-label={`Excluir venda ${sale.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
