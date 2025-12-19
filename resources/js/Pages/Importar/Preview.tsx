import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    FileText,
    Check,
    AlertTriangle,
    ArrowLeft,
    Download,
} from 'lucide-react';

interface Transacao {
    index: number;
    data: string;
    descricao: string;
    valor: number;
    tipo: string;
    identificador?: string;
    is_duplicate?: boolean;
    duplicate_ids?: number[];
}

interface Props {
    importacao: {
        id: number;
        arquivo_original: string;
        tipo: string;
        conta?: string;
        cartao?: string;
    };
    transacoes: Transacao[];
    mapeamento: Record<string, unknown> | null;
    needsMapping: boolean;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Math.abs(value));
}

export default function Preview({
    importacao,
    transacoes,
    mapeamento,
}: Props) {
    const [selectedIndexes, setSelectedIndexes] = useState<number[]>(
        transacoes
            .filter((t) => !t.is_duplicate)
            .map((t) => t.index)
    );

    const [processing, setProcessing] = useState(false);

    const handleToggle = (index: number) => {
        setSelectedIndexes((prev) =>
            prev.includes(index)
                ? prev.filter((i) => i !== index)
                : [...prev, index]
        );
    };

    const handleSelectAll = () => {
        const nonDuplicates = transacoes
            .filter((t) => !t.is_duplicate)
            .map((t) => t.index);
        setSelectedIndexes(nonDuplicates);
    };

    const handleDeselectAll = () => {
        setSelectedIndexes([]);
    };

    const handleSubmit = () => {
        setProcessing(true);
        router.post(
            `/importar/${importacao.id}/processar`,
            {
                selected: selectedIndexes,
                mapeamento: mapeamento ? JSON.stringify(mapeamento) : null,
            },
            {
                onFinish: () => setProcessing(false),
            }
        );
    };

    const totalSelecionadas = selectedIndexes.length;
    const totalReceitas = transacoes
        .filter((t) => selectedIndexes.includes(t.index) && t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
    const totalDespesas = transacoes
        .filter((t) => selectedIndexes.includes(t.index) && t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
    const duplicadas = transacoes.filter((t) => t.is_duplicate).length;

    return (
        <AppLayout header="Preview de Importação">
            <Head title="Preview - Importar" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a
                            href="/importar"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {importacao.arquivo_original}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {importacao.tipo.toUpperCase()}
                                {importacao.conta && ` • Conta: ${importacao.conta}`}
                                {importacao.cartao && ` • Cartão: ${importacao.cartao}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resumo */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm text-gray-500">Encontradas</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {transacoes.length}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm text-gray-500">Selecionadas</p>
                        <p className="text-2xl font-bold text-emerald-600">
                            {totalSelecionadas}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm text-gray-500">Duplicadas</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {duplicadas}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <p className="text-sm text-gray-500">Saldo</p>
                        <p
                            className={`text-2xl font-bold ${totalReceitas - totalDespesas >= 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                                }`}
                        >
                            {formatCurrency(totalReceitas - totalDespesas)}
                        </p>
                    </div>
                </div>

                {/* Aviso de duplicadas */}
                {duplicadas > 0 && (
                    <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
                        <AlertTriangle className="h-5 w-5" />
                        <p>
                            <strong>{duplicadas}</strong> transações já existem no
                            sistema e foram desmarcadas automaticamente.
                        </p>
                    </div>
                )}

                {/* Tabela de transações */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center justify-between border-b border-gray-100 p-4">
                        <h3 className="font-semibold text-gray-900">
                            Transações para Importar
                        </h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Selecionar todas
                            </button>
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Limpar seleção
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 text-left text-sm text-gray-500">
                                <tr>
                                    <th className="w-12 p-4"></th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4 text-right">Valor</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transacoes.map((transacao) => (
                                    <tr
                                        key={transacao.index}
                                        className={`${transacao.is_duplicate
                                            ? 'bg-amber-50/50 opacity-60'
                                            : selectedIndexes.includes(transacao.index)
                                                ? 'bg-emerald-50/50'
                                                : ''
                                            }`}
                                    >
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIndexes.includes(
                                                    transacao.index
                                                )}
                                                onChange={() =>
                                                    handleToggle(transacao.index)
                                                }
                                                disabled={transacao.is_duplicate}
                                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(transacao.data).toLocaleDateString(
                                                'pt-BR'
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-gray-900">
                                                {transacao.descricao}
                                            </p>
                                            {transacao.identificador && (
                                                <p className="text-xs text-gray-400">
                                                    ID: {transacao.identificador}
                                                </p>
                                            )}
                                        </td>
                                        <td
                                            className={`p-4 text-right font-semibold ${transacao.tipo === 'receita'
                                                ? 'text-emerald-600'
                                                : 'text-rose-600'
                                                }`}
                                        >
                                            {transacao.tipo === 'receita' ? '+' : '-'}
                                            {formatCurrency(transacao.valor)}
                                        </td>
                                        <td className="p-4">
                                            {transacao.is_duplicate ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Duplicada
                                                </span>
                                            ) : selectedIndexes.includes(
                                                transacao.index
                                            ) ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                    <Check className="h-3 w-3" />
                                                    Selecionada
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                                    Ignorar
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {transacoes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <FileText className="h-12 w-12 mb-2 opacity-30" />
                            <p>Nenhuma transação encontrada no arquivo</p>
                        </div>
                    )}
                </div>

                {/* Botões de ação */}
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">
                        <strong>{totalSelecionadas}</strong> transações serão importadas
                    </p>
                    <div className="flex gap-3">
                        <a
                            href="/importar"
                            className="rounded-xl px-6 py-2.5 font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancelar
                        </a>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing || totalSelecionadas === 0}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2.5 font-medium text-white shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            {processing ? 'Importando...' : 'Importar Selecionadas'}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
