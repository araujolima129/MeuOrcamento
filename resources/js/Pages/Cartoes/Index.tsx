import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, CreditCard, Wallet, X, ChevronRight } from 'lucide-react';

interface Conta {
    id: number;
    nome: string;
    banco: string;
    cor: string;
    saldo_inicial: number;
    saldo_atual: number;
    ativo: boolean;
}

interface Ciclo {
    id: number;
    mes: number;
    ano: number;
    data_vencimento: string;
    status: string;
    valor_total: number;
}

interface Cartao {
    id: number;
    nome: string;
    bandeira: string;
    final: string;
    limite: number;
    limite_disponivel: number;
    dia_fechamento: number;
    dia_vencimento: number;
    cor: string;
    ativo: boolean;
    ciclos: Ciclo[];
}

interface Props {
    contas: Conta[];
    cartoes: Cartao[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const cores = ['#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899', '#64748B', '#EAB308', '#EF4444'];

export default function Index({ contas, cartoes }: Props) {
    const [tab, setTab] = useState<'contas' | 'cartoes'>('contas');
    const [showContaModal, setShowContaModal] = useState(false);
    const [showCartaoModal, setShowCartaoModal] = useState(false);
    const [editingConta, setEditingConta] = useState<Conta | null>(null);
    const [editingCartao, setEditingCartao] = useState<Cartao | null>(null);

    const { data: contaData, setData: setContaData, post: postConta, put: putConta, processing: processingConta, reset: resetConta } = useForm({
        nome: '',
        banco: '',
        agencia: '',
        numero: '',
        saldo_inicial: '',
        cor: '#3B82F6',
    });

    const { data: cartaoData, setData: setCartaoData, post: postCartao, put: putCartao, processing: processingCartao, reset: resetCartao } = useForm({
        nome: '',
        bandeira: '',
        final: '',
        limite: '',
        dia_fechamento: '27',
        dia_vencimento: '15',
        cor: '#8B5CF6',
    });

    // Contas
    const openNewContaModal = () => {
        resetConta();
        setEditingConta(null);
        setShowContaModal(true);
    };

    const openEditContaModal = (conta: Conta) => {
        setContaData({
            nome: conta.nome,
            banco: conta.banco || '',
            agencia: '',
            numero: '',
            saldo_inicial: conta.saldo_inicial.toString(),
            cor: conta.cor || '#3B82F6',
        });
        setEditingConta(conta);
        setShowContaModal(true);
    };

    const handleContaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingConta) {
            putConta(`/contas/${editingConta.id}`, { onSuccess: () => { setShowContaModal(false); resetConta(); } });
        } else {
            postConta('/contas', { onSuccess: () => { setShowContaModal(false); resetConta(); } });
        }
    };

    const handleContaDelete = (id: number) => {
        if (confirm('Excluir conta?')) router.delete(`/contas/${id}`);
    };

    // Cartões
    const openNewCartaoModal = () => {
        resetCartao();
        setEditingCartao(null);
        setShowCartaoModal(true);
    };

    const openEditCartaoModal = (cartao: Cartao) => {
        setCartaoData({
            nome: cartao.nome,
            bandeira: cartao.bandeira || '',
            final: cartao.final || '',
            limite: cartao.limite.toString(),
            dia_fechamento: cartao.dia_fechamento.toString(),
            dia_vencimento: cartao.dia_vencimento.toString(),
            cor: cartao.cor || '#8B5CF6',
        });
        setEditingCartao(cartao);
        setShowCartaoModal(true);
    };

    const handleCartaoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCartao) {
            putCartao(`/cartoes/${editingCartao.id}`, { onSuccess: () => { setShowCartaoModal(false); resetCartao(); } });
        } else {
            postCartao('/cartoes', { onSuccess: () => { setShowCartaoModal(false); resetCartao(); } });
        }
    };

    const handleCartaoDelete = (id: number) => {
        if (confirm('Excluir cartão?')) router.delete(`/cartoes/${id}`);
    };

    return (
        <AppLayout header="Contas e Cartões">
            <Head title="Cartões" />

            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('contas')}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'contas' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Wallet className="h-4 w-4" />
                            Contas
                        </button>
                        <button
                            onClick={() => setTab('cartoes')}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'cartoes' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <CreditCard className="h-4 w-4" />
                            Cartões
                        </button>
                    </div>
                    <button
                        onClick={tab === 'contas' ? openNewContaModal : openNewCartaoModal}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Novo
                    </button>
                </div>

                {/* Contas */}
                {tab === 'contas' && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {contas.length > 0 ? (
                            contas.map((conta) => (
                                <div
                                    key={conta.id}
                                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                                    onClick={() => openEditContaModal(conta)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                                                style={{ backgroundColor: conta.cor }}
                                            >
                                                <Wallet className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{conta.nome}</p>
                                                <p className="text-sm text-gray-500">{conta.banco || 'Conta corrente'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleContaDelete(conta.id); }}
                                            className="text-gray-400 hover:text-rose-600"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500">Saldo atual</p>
                                        <p className={`text-xl font-bold ${conta.saldo_atual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(conta.saldo_atual)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-100">
                                <Wallet className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4 text-gray-500">Nenhuma conta cadastrada</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Cartões */}
                {tab === 'cartoes' && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cartoes.length > 0 ? (
                            cartoes.map((cartao) => (
                                <div
                                    key={cartao.id}
                                    className="group relative overflow-hidden rounded-2xl p-5 text-white"
                                    style={{ backgroundColor: cartao.cor }}
                                >
                                    <div className="flex items-start justify-between">
                                        <CreditCard className="h-8 w-8 text-white/80" />
                                        <span className="text-sm font-medium text-white/80">{cartao.bandeira}</span>
                                    </div>
                                    <p className="mt-4 text-lg font-bold">{cartao.nome}</p>
                                    <p className="text-sm text-white/70">**** {cartao.final}</p>
                                    <div className="mt-4 flex justify-between text-sm">
                                        <div>
                                            <p className="text-white/60">Limite disponível</p>
                                            <p className="font-semibold">{formatCurrency(cartao.limite_disponivel)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/60">Fatura atual</p>
                                            <p className="font-semibold">{formatCurrency(cartao.ciclos[0]?.valor_total || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-white/50">
                                        Fecha dia {cartao.dia_fechamento} • Vence dia {cartao.dia_vencimento}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                                        <button
                                            onClick={() => openEditCartaoModal(cartao)}
                                            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleCartaoDelete(cartao.id)}
                                            className="ml-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full rounded-2xl bg-white py-12 text-center shadow-sm ring-1 ring-gray-100">
                                <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-4 text-gray-500">Nenhum cartão cadastrado</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Conta */}
            {showContaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{editingConta ? 'Editar Conta' : 'Nova Conta'}</h3>
                            <button onClick={() => setShowContaModal(false)} className="rounded-lg p-1 text-gray-400"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleContaSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" value={contaData.nome} onChange={(e) => setContaData('nome', e.target.value)} placeholder="Ex: Conta Nubank" className="w-full rounded-xl border-gray-200" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Banco</label>
                                <input type="text" value={contaData.banco} onChange={(e) => setContaData('banco', e.target.value)} placeholder="Nubank, Itaú..." className="w-full rounded-xl border-gray-200" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Saldo Inicial</label>
                                <input type="number" step="0.01" value={contaData.saldo_inicial} onChange={(e) => setContaData('saldo_inicial', e.target.value)} className="w-full rounded-xl border-gray-200" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Cor</label>
                                <div className="flex gap-2">
                                    {cores.map((cor) => (
                                        <button key={cor} type="button" onClick={() => setContaData('cor', cor)} className={`h-8 w-8 rounded-full ${contaData.cor === cor ? 'ring-2 ring-offset-2 ring-pink-500' : ''}`} style={{ backgroundColor: cor }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowContaModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={processingConta} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">{processingConta ? 'Salvando...' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Cartão */}
            {showCartaoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{editingCartao ? 'Editar Cartão' : 'Novo Cartão'}</h3>
                            <button onClick={() => setShowCartaoModal(false)} className="rounded-lg p-1 text-gray-400"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleCartaoSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                                    <input type="text" value={cartaoData.nome} onChange={(e) => setCartaoData('nome', e.target.value)} placeholder="Nubank" className="w-full rounded-xl border-gray-200" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Bandeira</label>
                                    <input type="text" value={cartaoData.bandeira} onChange={(e) => setCartaoData('bandeira', e.target.value)} placeholder="Mastercard" className="w-full rounded-xl border-gray-200" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Final</label>
                                    <input type="text" maxLength={4} value={cartaoData.final} onChange={(e) => setCartaoData('final', e.target.value)} placeholder="1234" className="w-full rounded-xl border-gray-200" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Limite</label>
                                    <input type="number" step="0.01" value={cartaoData.limite} onChange={(e) => setCartaoData('limite', e.target.value)} className="w-full rounded-xl border-gray-200" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Dia Fechamento</label>
                                    <input type="number" min="1" max="31" value={cartaoData.dia_fechamento} onChange={(e) => setCartaoData('dia_fechamento', e.target.value)} className="w-full rounded-xl border-gray-200" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Dia Vencimento</label>
                                    <input type="number" min="1" max="31" value={cartaoData.dia_vencimento} onChange={(e) => setCartaoData('dia_vencimento', e.target.value)} className="w-full rounded-xl border-gray-200" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Cor</label>
                                <div className="flex gap-2">
                                    {cores.map((cor) => (
                                        <button key={cor} type="button" onClick={() => setCartaoData('cor', cor)} className={`h-8 w-8 rounded-full ${cartaoData.cor === cor ? 'ring-2 ring-offset-2 ring-pink-500' : ''}`} style={{ backgroundColor: cor }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCartaoModal(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={processingCartao} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50">{processingCartao ? 'Salvando...' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
