import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    X,
} from 'lucide-react';

interface Categoria {
    id: number;
    nome: string;
    cor: string;
    icone: string;
    tipo: string;
}

interface Responsavel {
    id: number;
    nome: string;
    cor: string;
}

interface Transacao {
    id: number;
    data: string;
    descricao: string;
    descricao_original: string;
    valor: number;
    tipo: string;
    forma_pagamento: string;
    fixa: boolean;
    parcelada: boolean;
    parcela_atual: number;
    parcela_total: number;
    categoria: Categoria | null;
    subcategoria: { id: number; nome: string } | null;
    responsavel: Responsavel | null;
    conta: string | null;
    cartao: string | null;
    has_splits: boolean;
}

interface Props {
    transacoes: {
        data: Transacao[];
        current_page: number;
        last_page: number;
        total: number;
    };
    categorias: Categoria[];
    responsaveis: Responsavel[];
    filtros: {
        mes: number;
        ano: number;
        tipo: string | null;
        categoria_id: number | null;
        responsavel_id: number | null;
        fixa: string | null;
        search: string | null;
    };
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Index({ transacoes, categorias, responsaveis, filtros }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [search, setSearch] = useState(filtros.search || '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: '',
        tipo: 'despesa',
        categoria_id: '',
        subcategoria_id: '',
        responsavel_id: '',
        conta_id: '',
        cartao_id: '',
        forma_pagamento: 'pix',
        fixa: false,
        parcelada: false,
        parcela_total: 2,
        observacoes: '',
    });

    const handleFilter = (key: string, value: any) => {
        router.get('/transacoes', { ...filtros, [key]: value }, { preserveState: true });
    };

    const handleSearch = () => {
        router.get('/transacoes', { ...filtros, search }, { preserveState: true });
    };

    const openNewModal = () => {
        reset();
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (t: Transacao) => {
        setData({
            data: t.data,
            descricao: t.descricao,
            valor: t.valor.toString(),
            tipo: t.tipo,
            categoria_id: t.categoria?.id?.toString() || '',
            subcategoria_id: t.subcategoria?.id?.toString() || '',
            responsavel_id: t.responsavel?.id?.toString() || '',
            conta_id: '',
            cartao_id: '',
            forma_pagamento: t.forma_pagamento || 'pix',
            fixa: t.fixa,
            parcelada: t.parcelada,
            parcela_total: t.parcela_total || 2,
            observacoes: '',
        });
        setEditingId(t.id);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/transacoes/${editingId}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/transacoes', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            router.delete(`/transacoes/${id}`);
        }
    };

    return (
        <AppLayout header="Transações">
            <Head title="Transações" />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        {/* Month/Year selector */}
                        <select
                            value={filtros.mes}
                            onChange={(e) => handleFilter('mes', e.target.value)}
                            className="rounded-xl border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium shadow-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            {meses.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={filtros.ano}
                            onChange={(e) => handleFilter('ano', e.target.value)}
                            className="rounded-xl border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium shadow-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            {[2023, 2024, 2025, 2026].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-48 rounded-xl border-gray-200 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-pink-500 focus:ring-pink-500"
                            />
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition ${showFilters
                                ? 'border-pink-500 bg-pink-50 text-pink-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                        </button>

                        {/* New button */}
                        <button
                            onClick={openNewModal}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-pink-600 hover:to-rose-600"
                        >
                            <Plus className="h-4 w-4" />
                            Nova
                        </button>
                    </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <select
                            value={filtros.tipo || ''}
                            onChange={(e) => handleFilter('tipo', e.target.value || null)}
                            className="rounded-lg border-gray-200 py-1.5 text-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            <option value="">Todos os tipos</option>
                            <option value="receita">Receitas</option>
                            <option value="despesa">Despesas</option>
                        </select>
                        <select
                            value={filtros.categoria_id || ''}
                            onChange={(e) => handleFilter('categoria_id', e.target.value || null)}
                            className="rounded-lg border-gray-200 py-1.5 text-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            <option value="">Todas as categorias</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                        <select
                            value={filtros.responsavel_id || ''}
                            onChange={(e) => handleFilter('responsavel_id', e.target.value || null)}
                            className="rounded-lg border-gray-200 py-1.5 text-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            <option value="">Todos os responsáveis</option>
                            {responsaveis.map((r) => (
                                <option key={r.id} value={r.id}>{r.nome}</option>
                            ))}
                        </select>
                        <select
                            value={filtros.fixa || ''}
                            onChange={(e) => handleFilter('fixa', e.target.value || null)}
                            className="rounded-lg border-gray-200 py-1.5 text-sm focus:border-pink-500 focus:ring-pink-500"
                        >
                            <option value="">Todas</option>
                            <option value="true">Fixas</option>
                            <option value="false">Variáveis</option>
                        </select>
                    </div>
                )}

                {/* Transactions table */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Descrição</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Categoria</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Responsável</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Valor</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transacoes.data.length > 0 ? (
                                    transacoes.data.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                                {new Date(t.data).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {t.tipo === 'receita' ? (
                                                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                                                    )}
                                                    <span className="font-medium text-gray-900">{t.descricao}</span>
                                                    {t.fixa && (
                                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                            Fixa
                                                        </span>
                                                    )}
                                                    {t.parcelada && (
                                                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                            {t.parcela_atual}/{t.parcela_total}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {t.categoria ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                                                        style={{
                                                            backgroundColor: `${t.categoria.cor}20`,
                                                            color: t.categoria.cor,
                                                        }}
                                                    >
                                                        {t.categoria.nome}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {t.responsavel ? (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-6 w-6 rounded-full text-center text-xs font-bold leading-6 text-white"
                                                            style={{ backgroundColor: t.responsavel.cor }}
                                                        >
                                                            {t.responsavel.nome.charAt(0)}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{t.responsavel.nome}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <span
                                                    className={`font-semibold ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}
                                                >
                                                    {t.tipo === 'receita' ? '+' : '-'}
                                                    {formatCurrency(t.valor)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(t)}
                                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            Nenhuma transação encontrada
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transacoes.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                            <span className="text-sm text-gray-500">
                                {transacoes.total} transações
                            </span>
                            <div className="flex gap-1">
                                {Array.from({ length: transacoes.last_page }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleFilter('page', i + 1)}
                                        className={`min-w-[32px] rounded-lg px-3 py-1 text-sm font-medium ${transacoes.current_page === i + 1
                                            ? 'bg-pink-500 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingId ? 'Editar Transação' : 'Nova Transação'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Tipo */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData('tipo', 'despesa')}
                                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${data.tipo === 'despesa'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Despesa
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('tipo', 'receita')}
                                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${data.tipo === 'receita'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Receita
                                </button>
                            </div>

                            {/* Data e Valor */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Data
                                    </label>
                                    <input
                                        type="date"
                                        value={data.data}
                                        onChange={(e) => setData('data', e.target.value)}
                                        className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Valor
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.valor}
                                        onChange={(e) => setData('valor', e.target.value)}
                                        placeholder="0,00"
                                        className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={data.descricao}
                                    onChange={(e) => setData('descricao', e.target.value)}
                                    placeholder="Ex: Supermercado, Salário..."
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            {/* Categoria */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Categoria
                                </label>
                                <select
                                    value={data.categoria_id}
                                    onChange={(e) => setData('categoria_id', e.target.value)}
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                >
                                    <option value="">Selecione...</option>
                                    {categorias
                                        .filter((c) => c.tipo === data.tipo)
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.nome}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Responsável */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Responsável
                                </label>
                                <select
                                    value={data.responsavel_id}
                                    onChange={(e) => setData('responsavel_id', e.target.value)}
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                >
                                    <option value="">Selecione...</option>
                                    {responsaveis.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Flags */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.fixa}
                                        onChange={(e) => setData('fixa', e.target.checked)}
                                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700">Despesa Fixa</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.parcelada}
                                        onChange={(e) => setData('parcelada', e.target.checked)}
                                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700">Parcelada</span>
                                </label>
                            </div>

                            {data.parcelada && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Número de Parcelas
                                    </label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="60"
                                        value={data.parcela_total}
                                        onChange={(e) => setData('parcela_total', parseInt(e.target.value))}
                                        className="w-32 rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
                                >
                                    {processing ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
