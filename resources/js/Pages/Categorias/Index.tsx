import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';

interface Subcategoria {
    id: number;
    nome: string;
    icone: string;
    ativo: boolean;
}

interface Categoria {
    id: number;
    nome: string;
    icone: string;
    cor: string;
    tipo: string;
    ativo: boolean;
    subcategorias: Subcategoria[];
}

interface Props {
    categorias: Categoria[];
    filtroTipo: string | null;
}

const cores = [
    '#E91E8C', '#9333ea', '#3b82f6', '#06b6d4', '#10b981',
    '#84cc16', '#eab308', '#f97316', '#ef4444', '#8b5cf6',
];

const icones = [
    '🏠', '🚗', '🍔', '💊', '🎓', '💼', '🎮', '🛒', '✈️', '💰',
    '💳', '📱', '👕', '🎁', '🏋️', '🎬', '📚', '🐶', '💡', '🔧',
];

export default function Index({ categorias, filtroTipo }: Props) {
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingSub, setEditingSub] = useState<{ catId: number; sub?: Subcategoria } | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        nome: '',
        icone: '🏠',
        cor: '#E91E8C',
        tipo: 'despesa',
    });

    const {
        data: subData,
        setData: setSubData,
        post: postSub,
        put: putSub,
        processing: processingSub,
        reset: resetSub,
    } = useForm({
        nome: '',
        icone: '📋',
    });

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleFilter = (tipo: string | null) => {
        router.get('/categorias', tipo ? { tipo } : {}, { preserveState: true });
    };

    const openNewModal = () => {
        reset();
        setData('tipo', filtroTipo || 'despesa');
        setEditingCategoria(null);
        setShowModal(true);
    };

    const openEditModal = (cat: Categoria) => {
        setData({
            nome: cat.nome,
            icone: cat.icone || '🏠',
            cor: cat.cor || '#E91E8C',
            tipo: cat.tipo,
        });
        setEditingCategoria(cat);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategoria) {
            put(`/categorias/${editingCategoria.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/categorias', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            router.delete(`/categorias/${id}`);
        }
    };

    // Subcategorias
    const openNewSubModal = (catId: number) => {
        resetSub();
        setEditingSub({ catId });
        setShowSubModal(true);
    };

    const openEditSubModal = (catId: number, sub: Subcategoria) => {
        setSubData({
            nome: sub.nome,
            icone: sub.icone || '📋',
        });
        setEditingSub({ catId, sub });
        setShowSubModal(true);
    };

    const handleSubSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSub) return;

        if (editingSub.sub) {
            putSub(`/subcategorias/${editingSub.sub.id}`, {
                onSuccess: () => {
                    setShowSubModal(false);
                    resetSub();
                },
            });
        } else {
            postSub(`/categorias/${editingSub.catId}/subcategorias`, {
                onSuccess: () => {
                    setShowSubModal(false);
                    resetSub();
                },
            });
        }
    };

    const handleSubDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta subcategoria?')) {
            router.delete(`/subcategorias/${id}`);
        }
    };

    const despesas = categorias.filter((c) => c.tipo === 'despesa');
    const receitas = categorias.filter((c) => c.tipo === 'receita');

    const renderCategorias = (cats: Categoria[], tipo: string) => (
        <div className="space-y-2">
            {cats.length > 0 ? (
                cats.map((cat) => (
                    <div
                        key={cat.id}
                        className="overflow-hidden rounded-xl border border-gray-100 bg-white"
                    >
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleExpand(cat.id)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    {expandedIds.includes(cat.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                                    style={{ backgroundColor: `${cat.cor}20` }}
                                >
                                    {cat.icone || '📋'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{cat.nome}</p>
                                    <p className="text-sm text-gray-500">
                                        {cat.subcategorias.length} subcategorias
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: cat.cor }}
                                />
                                <button
                                    onClick={() => openEditModal(cat)}
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Subcategorias */}
                        {expandedIds.includes(cat.id) && (
                            <div className="border-t border-gray-100 bg-gray-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-500">
                                        Subcategorias
                                    </span>
                                    <button
                                        onClick={() => openNewSubModal(cat.id)}
                                        className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Adicionar
                                    </button>
                                </div>
                                {cat.subcategorias.length > 0 ? (
                                    <div className="space-y-2">
                                        {cat.subcategorias.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{sub.icone || '📋'}</span>
                                                    <span className="text-sm text-gray-700">
                                                        {sub.nome}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEditSubModal(cat.id, sub)}
                                                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubDelete(sub.id)}
                                                        className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-gray-400">
                                        Nenhuma subcategoria
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p className="py-8 text-center text-gray-500">
                    Nenhuma categoria cadastrada
                </p>
            )}
        </div>
    );

    return (
        <AppLayout header="Categorias">
            <Head title="Categorias" />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleFilter(null)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${!filtroTipo
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => handleFilter('despesa')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filtroTipo === 'despesa'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Despesas
                        </button>
                        <button
                            onClick={() => handleFilter('receita')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filtroTipo === 'receita'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Receitas
                        </button>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-pink-600 hover:to-rose-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Categoria
                    </button>
                </div>

                {/* Content */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Despesas */}
                    {(!filtroTipo || filtroTipo === 'despesa') && (
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <span className="h-3 w-3 rounded-full bg-rose-500" />
                                Despesas
                            </h3>
                            {renderCategorias(despesas, 'despesa')}
                        </div>
                    )}

                    {/* Receitas */}
                    {(!filtroTipo || filtroTipo === 'receita') && (
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                Receitas
                            </h3>
                            {renderCategorias(receitas, 'receita')}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Categoria */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
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
                            {!editingCategoria && (
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
                            )}

                            {/* Nome */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                    placeholder="Ex: Alimentação, Transporte..."
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            {/* Ícone */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Ícone
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {icones.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setData('icone', icon)}
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition ${data.icone === icon
                                                    ? 'bg-pink-100 ring-2 ring-pink-500'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cor */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Cor
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {cores.map((cor) => (
                                        <button
                                            key={cor}
                                            type="button"
                                            onClick={() => setData('cor', cor)}
                                            className={`h-8 w-8 rounded-full transition ${data.cor === cor
                                                    ? 'ring-2 ring-offset-2 ring-pink-500'
                                                    : ''
                                                }`}
                                            style={{ backgroundColor: cor }}
                                        />
                                    ))}
                                </div>
                            </div>

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

            {/* Modal Subcategoria */}
            {showSubModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingSub?.sub ? 'Editar Subcategoria' : 'Nova Subcategoria'}
                            </h3>
                            <button
                                onClick={() => setShowSubModal(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={subData.nome}
                                    onChange={(e) => setSubData('nome', e.target.value)}
                                    placeholder="Ex: Restaurante, Supermercado..."
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Ícone
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {icones.slice(0, 10).map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setSubData('icone', icon)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition ${subData.icone === icon
                                                    ? 'bg-pink-100 ring-2 ring-pink-500'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSubModal(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingSub}
                                    className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
                                >
                                    {processingSub ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
