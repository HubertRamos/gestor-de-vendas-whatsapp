import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit3 } from 'lucide-react';
import { Product } from '../types';
import { formatMoney } from '../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  onOpenNewProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onRequestDeleteProduct: (product: Product) => void;
}

export function ProductsView({
  products,
  onOpenNewProduct,
  onOpenEditProduct,
  onRequestDeleteProduct,
}: ProductsViewProps) {
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const categories = useMemo(() => {
    const cats = new Set<string>(['Todas']);
    products.forEach((p) => cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesText =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === 'Todas' || p.category === categoryFilter;
      return matchesText && matchesCat;
    });
  }, [products, productSearch, categoryFilter]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5 space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Catálogo de produtos
            </h1>
            <p className="text-xs text-slate-500">
              Itens disponíveis para venda rápida no caixa (sem controle de
              estoque)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <div className="relative flex-1 sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 focus:border-[#6D4AFF] focus:outline-none"
                />
              </div>
            )}
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Plus size={14} />
              <span>Novo produto</span>
            </button>
          </div>
        </div>

        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
            <tr>
              <th className="px-5 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Preço de venda</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Ganho por unidade</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  <p className="mb-3">
                    Nenhum produto cadastrado ainda. Cadastre os itens vendidos
                    nos eventos para agilizar o caixa.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNewProduct}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-xs font-semibold text-white whitespace-nowrap"
                  >
                    <Plus size={14} />
                    <span>Cadastrar primeiro produto</span>
                  </button>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  Nenhum produto encontrado nessa busca.
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => {
                const hasCost = prod.costPrice > 0;
                const margin = prod.defaultPrice - prod.costPrice;
                return (
                  <tr
                    key={prod.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {prod.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {prod.category}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatMoney(prod.defaultPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-500">
                      {hasCost ? formatMoney(prod.costPrice) : '—'}
                    </td>
                    <td
                      className={`px-4 py-3.5 text-right font-mono font-semibold tabular-nums ${
                        !hasCost
                          ? 'text-slate-400 font-normal'
                          : margin >= 0
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {!hasCost
                        ? '—'
                        : `${margin >= 0 ? '+' : ''}${formatMoney(margin)}`}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct({ ...prod })}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#6D4AFF] hover:bg-[#6D4AFF]/10 whitespace-nowrap"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteProduct(prod)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remover produto ${prod.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
