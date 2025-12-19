import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Target, X, TrendingUp } from 'lucide-react';

interface Meta {
    id: number;
    nome: string;
    descricao: string;
    icone: string;
    valor_alvo: number;
    valor_condicao_parcelas: number | null;
    valor_atual: number;
    progresso: number;
    data_limite: string | null;
    status: string;
    atingida: boolean;
}

interface Props {
    metas: Meta[];
    filtroStatus: string | null;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

const icones = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏋️', '🎸', '📚', '💰'];

export default function Index({ metas, filtroStatus }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showAporteModal, setShowAporteModal] = useState(false);
    const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
    const [aporteMetaId, setAporteMetaId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        nome: '',
        descricao: '',
        icone: '🎯',
        valor_alvo: '',
        valor_condicao_parcelas: '',
        data_limite: '',
    });

    const {
        data: aporteData,
        setData: setAporteData,
        post: postAporte,
        processing: processingAporte,
        reset: resetAporte,
    } = useForm({
        data: new Date().toISOString().split('T')[0],
        valor: '',
        observacao: '',
    });

    const handleFilter = (status: string | null) => {
        router.get('/metas', status ? { status } : {}, { preserveState: true });
    };

    const openNewModal = () => {
        reset();
        setEditingMeta(null);
        setShowModal(true);
    };

    const openEditModal = (meta: Meta) => {
        setData({
            nome: meta.nome,
            descricao: meta.descricao || '',
            icone: meta.icone || '🎯',
            valor_alvo: meta.valor_alvo.toString(),
            valor_condicao_parcelas: meta.valor_condicao_parcelas?.toString() || '',
            data_limite: meta.data_limite || '',
        });
        setEditingMeta(meta);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMeta) {
            put(`/metas/${editingMeta.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/metas', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            router.delete(`/metas/${id}`);
        }
    };

    const openAporteModal = (metaId: number) => {
        resetAporte();
        setAporteMetaId(metaId);
        setShowAporteModal(true);
    };

    const handleAporteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!aporteMetaId) return;
        postAporte(`/metas/${aporteMetaId}/aportes`, {
            onSuccess: () => {
                setShowAporteModal(false);
                resetAporte();
            },
        });
    };

    const ativas = metas.filter((m) => m.status === 'ativa');
    const atingidas = metas.filter((m) => m.status === 'atingida');

    return (
        <AppLayout header="Metas">
            <Head title="Metas" />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleFilter(null)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${!filtroStatus ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => handleFilter('ativa')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filtroStatus === 'ativa' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Ativas
                        </button>
                        <button
                            onClick={() => handleFilter('atingida')}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filtroStatus === 'atingida' ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Conquistadas
                        </button>
                    </div>
                    <button
                        onClick={openNewModal}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-pink-600 hover:to-rose-600"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Meta
                    </button>
                </div>

                {/* Metas Grid */}
                {(!filtroStatus || filtroStatus === 'ativa') && ativas.length > 0 && (
                    <div>
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Target className="h-5 w-5 text-emerald-500" />
                            Em andamento
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {ativas.map((meta) => (
                                <div
                                    key={meta.id}
                                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lime-100 to-emerald-100 text-2xl">
                                                {meta.icone || '🎯'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{meta.nome}</p>
                                                {meta.data_limite && (
                                                    <p className="text-sm text-gray-500">
                                                        até {new Date(meta.data_limite).toLocaleDateString('pt-BR')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openEditModal(meta)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            ✏️
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="mb-1 flex items-end justify-between">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(meta.valor_atual)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                de {formatCurrency(meta.valor_alvo)}
                                            </span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all"
                                                style={{ width: `${meta.progresso}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-right text-sm font-medium text-emerald-600">
                                            {meta.progresso.toFixed(0)}%
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => openAporteModal(meta.id)}
                                        className="w-full rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 py-2 text-sm font-medium text-white hover:from-lime-500 hover:to-emerald-600"
                                    >
                                        + Registrar Aporte
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metas Atingidas */}
                {(!filtroStatus || filtroStatus === 'atingida') && atingidas.length > 0 && (
                    <div>
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <TrendingUp className="h-5 w-5 text-pink-500" />
                            Conquistadas 🎉
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {atingidas.map((meta) => (
                                <div
                                    key={meta.id}
                                    className="rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-5 ring-1 ring-pink-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-2xl">
                                            🏆
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{meta.nome}</p>
                                            <p className="text-sm text-pink-600">{formatCurrency(meta.valor_alvo)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {metas.length === 0 && (
                    <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
                        <Target className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-gray-500">Nenhuma meta cadastrada</p>
                        <button
                            onClick={openNewModal}
                            className="mt-4 text-sm font-medium text-pink-600 hover:text-pink-700"
                        >
                            + Criar primeira meta
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Meta */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingMeta ? 'Editar Meta' : 'Nova Meta'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                                <input
                                    type="text"
                                    value={data.nome}
                                    onChange={(e) => setData('nome', e.target.value)}
                                    placeholder="Ex: Viagem para Europa"
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Ícone</label>
                                <div className="flex flex-wrap gap-2">
                                    {icones.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setData('icone', icon)}
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${data.icone === icon ? 'bg-pink-100 ring-2 ring-pink-500' : 'bg-gray-100'
                                                }`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Valor Alvo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.valor_alvo}
                                    onChange={(e) => setData('valor_alvo', e.target.value)}
                                    placeholder="0,00"
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Data Limite (opcional)</label>
                                <input
                                    type="date"
                                    value={data.data_limite}
                                    onChange={(e) => setData('data_limite', e.target.value)}
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">
                                    {processing ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Aporte */}
            {showAporteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Registrar Aporte</h3>
                        <form onSubmit={handleAporteSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Data</label>
                                <input
                                    type="date"
                                    value={aporteData.data}
                                    onChange={(e) => setAporteData('data', e.target.value)}
                                    className="w-full rounded-xl border-gray-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Valor</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={aporteData.valor}
                                    onChange={(e) => setAporteData('valor', e.target.value)}
                                    placeholder="0,00"
                                    className="w-full rounded-xl border-gray-200"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Observação (opcional)</label>
                                <input
                                    type="text"
                                    value={aporteData.observacao}
                                    onChange={(e) => setAporteData('observacao', e.target.value)}
                                    className="w-full rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowAporteModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processingAporte} className="rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">
                                    {processingAporte ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
