import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Copy, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface CategoriaOrcamento {
    id: number;
    categoria_id: number;
    categoria_nome: string;
    categoria_cor: string;
    subcategoria_id: number | null;
    subcategoria_nome: string | null;
    planejado: number;
    realizado: number;
    saldo: number;
    percentual: number;
    protegido: boolean;
}

interface Categoria {
    id: number;
    nome: string;
    cor: string;
    icone: string;
    subcategorias?: { id: number; nome: string }[];
}

interface Props {
    resumo: {
        mes: number;
        ano: number;
        total_planejado: number;
        total_realizado: number;
        total_saldo: number;
        percentual_geral: number;
        categorias: CategoriaOrcamento[];
    };
    categorias: Categoria[];
    mes: number;
    ano: number;
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

export default function Index({ resumo, categorias, mes, ano }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        categoria_id: '',
        subcategoria_id: '',
        mes: mes,
        ano: ano,
        valor_planejado: '',
        protegido: false,
    });

    const { data: copyData, setData: setCopyData, post: postCopy, processing: processingCopy } = useForm({
        mes_origem: mes === 1 ? 12 : mes - 1,
        ano_origem: mes === 1 ? ano - 1 : ano,
        mes_destino: mes,
        ano_destino: ano,
    });

    const handleMonthChange = (newMes: number, newAno: number) => {
        router.get('/orcamento', { mes: newMes, ano: newAno }, { preserveState: true });
    };

    const openNewModal = () => {
        reset();
        setData({ ...data, mes, ano, valor_planejado: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (orc: CategoriaOrcamento) => {
        setData({
            categoria_id: orc.categoria_id.toString(),
            subcategoria_id: orc.subcategoria_id?.toString() || '',
            mes: resumo.mes,
            ano: resumo.ano,
            valor_planejado: orc.planejado.toString(),
            protegido: orc.protegido,
        });
        setEditingId(orc.id);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(`/orcamento/${editingId}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post('/orcamento', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir este orçamento?')) {
            router.delete(`/orcamento/${id}`);
        }
    };

    const handleCopy = (e: React.FormEvent) => {
        e.preventDefault();
        postCopy('/orcamento/copiar', {
            onSuccess: () => setShowCopyModal(false),
        });
    };

    const selectedCategoria = categorias.find((c) => c.id.toString() === data.categoria_id);

    return (
        <AppLayout header="Orçamento">
            <Head title="Orçamento" />

            <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleMonthChange(mes === 1 ? 12 : mes - 1, mes === 1 ? ano - 1 : ano)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                        >
                            ←
                        </button>
                        <span className="text-lg font-semibold text-gray-900">
                            {meses[resumo.mes - 1]} {resumo.ano}
                        </span>
                        <button
                            onClick={() => handleMonthChange(mes === 12 ? 1 : mes + 1, mes === 12 ? ano + 1 : ano)}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                        >
                            →
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCopyModal(true)}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                            <Copy className="h-4 w-4" />
                            Copiar Mês
                        </button>
                        <button
                            onClick={openNewModal}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-pink-600 hover:to-rose-600"
                        >
                            <Plus className="h-4 w-4" />
                            Novo
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm font-medium text-gray-500">Planejado</p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {formatCurrency(resumo.total_planejado)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm font-medium text-gray-500">Realizado</p>
                        <p className="mt-1 text-xl font-bold text-rose-600">
                            {formatCurrency(resumo.total_realizado)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm font-medium text-gray-500">Saldo</p>
                        <p className={`mt-1 text-xl font-bold ${resumo.total_saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(resumo.total_saldo)}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm font-medium text-gray-500">Utilizado</p>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {resumo.percentual_geral.toFixed(0)}%
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-gray-200">
                            <div
                                className={`h-full rounded-full ${resumo.percentual_geral > 100
                                        ? 'bg-rose-500'
                                        : resumo.percentual_geral > 80
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${Math.min(resumo.percentual_geral, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Budget list */}
                <div className="space-y-3">
                    {resumo.categorias.length > 0 ? (
                        resumo.categorias.map((orc) => (
                            <div
                                key={orc.id}
                                className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-xl"
                                            style={{ backgroundColor: `${orc.categoria_cor}20` }}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {orc.categoria_nome}
                                                {orc.subcategoria_nome && (
                                                    <span className="text-gray-500"> › {orc.subcategoria_nome}</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatCurrency(orc.realizado)} de {formatCurrency(orc.planejado)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {orc.saldo < 0 && (
                                            <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                                                <AlertTriangle className="h-3 w-3" />
                                                Excedido
                                            </span>
                                        )}
                                        {orc.protegido && (
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                Protegido
                                            </span>
                                        )}
                                        <button
                                            onClick={() => openEditModal(orc)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(orc.id)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{orc.percentual.toFixed(0)}% utilizado</span>
                                        <span className={orc.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            Saldo: {formatCurrency(orc.saldo)}
                                        </span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-gray-100">
                                        <div
                                            className={`h-full rounded-full transition-all ${orc.percentual > 100
                                                    ? 'bg-rose-500'
                                                    : orc.percentual > 80
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                            style={{
                                                width: `${Math.min(orc.percentual, 100)}%`,
                                                backgroundColor: orc.categoria_cor,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="rounded-xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-100">
                            <p className="text-gray-500">Nenhum orçamento cadastrado para este mês</p>
                            <button
                                onClick={openNewModal}
                                className="mt-4 text-sm font-medium text-pink-600 hover:text-pink-700"
                            >
                                + Adicionar orçamento
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Novo/Editar */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingId ? 'Editar Orçamento' : 'Novo Orçamento'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                                <select
                                    value={data.categoria_id}
                                    onChange={(e) => setData('categoria_id', e.target.value)}
                                    disabled={!!editingId}
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 disabled:bg-gray-100"
                                >
                                    <option value="">Selecione...</option>
                                    {categorias.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCategoria?.subcategorias && selectedCategoria.subcategorias.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Subcategoria (opcional)</label>
                                    <select
                                        value={data.subcategoria_id}
                                        onChange={(e) => setData('subcategoria_id', e.target.value)}
                                        disabled={!!editingId}
                                        className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 disabled:bg-gray-100"
                                    >
                                        <option value="">Todas</option>
                                        {selectedCategoria.subcategorias.map((s) => (
                                            <option key={s.id} value={s.id}>{s.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Valor Planejado</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.valor_planejado}
                                    onChange={(e) => setData('valor_planejado', e.target.value)}
                                    placeholder="0,00"
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.protegido}
                                    onChange={(e) => setData('protegido', e.target.checked)}
                                    className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700">Proteger de redistribuição</span>
                            </label>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white hover:from-pink-600 hover:to-rose-600 disabled:opacity-50">
                                    {processing ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Copiar */}
            {showCopyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Copiar Orçamento</h3>
                        <form onSubmit={handleCopy} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">De</label>
                                <div className="flex gap-2">
                                    <select
                                        value={copyData.mes_origem}
                                        onChange={(e) => setCopyData('mes_origem', parseInt(e.target.value))}
                                        className="flex-1 rounded-xl border-gray-200"
                                    >
                                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                    <select
                                        value={copyData.ano_origem}
                                        onChange={(e) => setCopyData('ano_origem', parseInt(e.target.value))}
                                        className="w-24 rounded-xl border-gray-200"
                                    >
                                        {[2023, 2024, 2025].map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Para</label>
                                <div className="flex gap-2">
                                    <select
                                        value={copyData.mes_destino}
                                        onChange={(e) => setCopyData('mes_destino', parseInt(e.target.value))}
                                        className="flex-1 rounded-xl border-gray-200"
                                    >
                                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                    </select>
                                    <select
                                        value={copyData.ano_destino}
                                        onChange={(e) => setCopyData('ano_destino', parseInt(e.target.value))}
                                        className="w-24 rounded-xl border-gray-200"
                                    >
                                        {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCopyModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processingCopy} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">
                                    {processingCopy ? 'Copiando...' : 'Copiar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
