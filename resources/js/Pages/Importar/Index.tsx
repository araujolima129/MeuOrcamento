import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Upload, FileText, Check, X, AlertTriangle, Edit2 } from 'lucide-react';

interface Importacao {
    id: number;
    nome: string | null;
    arquivo_original: string;
    tipo: string;
    status: string;
    total_itens: number;
    itens_importados: number;
    itens_duplicados: number;
    itens_erro: number;
    progresso: number;
    conta: string | null;
    cartao: string | null;
    created_at: string;
}

interface Props {
    importacoes: {
        data: Importacao[];
        current_page: number;
        last_page: number;
    };
    contas: { id: number; nome: string }[];
    cartoes: { id: number; nome: string }[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
    processando: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
    concluida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700' },
    com_alertas: { label: 'Com Alertas', color: 'bg-amber-100 text-amber-700' },
    falhou: { label: 'Falhou', color: 'bg-rose-100 text-rose-700' },
};

export default function Index({ importacoes, contas, cartoes }: Props) {
    const [dragOver, setDragOver] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm<{
        arquivo: File | null;
        conta_id: string;
        cartao_id: string;
    }>({
        arquivo: null,
        conta_id: '',
        cartao_id: '',
    });

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) setData('arquivo', file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setData('arquivo', file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/importar/upload', {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const openRenameModal = (imp: Importacao) => {
        setEditingId(imp.id);
        setEditName(imp.nome || imp.arquivo_original);
        setError(null);
    };

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId || !editName.trim()) return;

        setSaving(true);
        router.put(`/importar/${editingId}/rename`, { nome: editName.trim() }, {
            onSuccess: () => {
                setEditingId(null);
                setEditName('');
                setSaving(false);
            },
            onError: (errors) => {
                setError(errors.nome || 'Erro ao salvar');
                setSaving(false);
            },
        });
    };

    const canSubmit = data.arquivo && (data.conta_id || data.cartao_id);

    return (
        <AppLayout header="Importar Extrato">
            <Head title="Importar" />

            <div className="space-y-6">
                {/* Upload Area */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div
                            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${dragOver ? 'border-pink-500 bg-pink-50' : 'border-gray-300'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <Upload className="h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-600">
                                Arraste um arquivo ou{' '}
                                <label className="cursor-pointer font-medium text-pink-600 hover:text-pink-700">
                                    selecione
                                    <input type="file" accept=".ofx,.qfx,.csv,.txt" className="hidden" onChange={handleFileChange} />
                                </label>
                            </p>
                            <p className="mt-1 text-sm text-gray-400">OFX, CSV ou TXT (máx. 10MB)</p>

                            {data.arquivo && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">{data.arquivo.name}</span>
                                    <button type="button" onClick={() => setData('arquivo', null)} className="ml-2 text-gray-400 hover:text-rose-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Conta <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.conta_id}
                                    onChange={(e) => { setData('conta_id', e.target.value); setData('cartao_id', ''); }}
                                    className={`w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 ${errors.conta_id ? 'border-rose-500' : ''}`}
                                >
                                    <option value="">Selecione...</option>
                                    {contas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Cartão <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.cartao_id}
                                    onChange={(e) => { setData('cartao_id', e.target.value); setData('conta_id', ''); }}
                                    className={`w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500 ${errors.cartao_id ? 'border-rose-500' : ''}`}
                                >
                                    <option value="">Selecione...</option>
                                    {cartoes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(errors.conta_id || errors.cartao_id) && (
                            <p className="text-sm text-rose-600">
                                Selecione uma conta ou um cartão para vincular as transações.
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!canSubmit || processing}
                                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {processing ? 'Enviando...' : 'Importar'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Histórico */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Histórico de Importações</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {importacoes.data.length > 0 ? (
                            importacoes.data.map((imp) => (
                                <div
                                    key={imp.id}
                                    className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50"
                                >
                                    <div
                                        className="flex flex-1 cursor-pointer items-center gap-4"
                                        onClick={() => imp.status === 'pendente' && router.visit(`/importar/${imp.id}/preview`)}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                                            <FileText className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{imp.nome || imp.arquivo_original}</p>
                                            <p className="text-sm text-gray-500">
                                                {imp.created_at} • {imp.conta || imp.cartao || 'Não vinculado'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openRenameModal(imp); }}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                            title="Renomear"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <div className="text-right text-sm">
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-emerald-500" />
                                                <span>{imp.itens_importados}</span>
                                            </div>
                                            {imp.itens_duplicados > 0 && (
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <span>{imp.itens_duplicados} dup</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusLabels[imp.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                                            {statusLabels[imp.status]?.label || imp.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-gray-500">
                                Nenhuma importação realizada
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Renomear */}
            {editingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setEditingId(null)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-4">Renomear Importação</h3>

                        <form onSubmit={handleRename} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full rounded-xl border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                                    placeholder="Ex: Extrato Cartão BB Dezembro"
                                    autoFocus
                                />
                                {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !editName.trim()}
                                    className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
