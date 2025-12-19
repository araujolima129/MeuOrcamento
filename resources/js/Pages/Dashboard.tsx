import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Target,
    ArrowRight,
} from 'lucide-react';

interface Props {
    mes: number;
    ano: number;
    resumo: {
        receitas: number;
        despesas: number;
        saldo: number;
    };
    orcamento: {
        total_planejado: number;
        total_realizado: number;
        percentual_geral: number;
        categorias: Array<{
            id: number;
            categoria_nome: string;
            categoria_cor: string;
            planejado: number;
            realizado: number;
            saldo: number;
            percentual: number;
        }>;
    };
    gastosPorCategoria: Array<{
        nome: string;
        cor: string;
        valor: number;
    }>;
    gastosPorResponsavel: Array<{
        nome: string;
        cor: string;
        avatar?: string;
        valor: number;
    }>;
    cartoes: Array<{
        id: number;
        nome: string;
        bandeira: string;
        cor: string;
        limite: number;
        limite_disponivel: number;
        fatura_atual: number;
    }>;
    metas: Array<{
        id: number;
        nome: string;
        icone: string;
        valor_alvo: number;
        valor_atual: number;
        progresso: number;
    }>;
    ultimasTransacoes: Array<{
        id: number;
        data: string;
        descricao: string;
        valor: number;
        tipo: string;
        categoria: string;
        categoria_cor: string;
        categoria_icone: string;
    }>;
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

export default function Dashboard({
    mes,
    ano,
    resumo,
    orcamento,
    gastosPorCategoria,
    gastosPorResponsavel,
    cartoes,
    metas,
    ultimasTransacoes,
}: Props) {
    return (
        <AppLayout header={`Visão Geral - ${meses[mes - 1]} ${ano}`}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Cards de Resumo */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Receitas */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Receitas</p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600">
                                    {formatCurrency(resumo.receitas)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    {/* Despesas */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Despesas</p>
                                <p className="mt-1 text-2xl font-bold text-rose-600">
                                    {formatCurrency(resumo.despesas)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                                <TrendingDown className="h-6 w-6 text-rose-600" />
                            </div>
                        </div>
                    </div>

                    {/* Saldo */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Saldo</p>
                                <p
                                    className={`mt-1 text-2xl font-bold ${resumo.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                >
                                    {formatCurrency(resumo.saldo)}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Wallet className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Orçamento */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Orçamento</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {orcamento.percentual_geral.toFixed(0)}%
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
                                <Target className="h-6 w-6 text-pink-600" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-full rounded-full transition-all ${orcamento.percentual_geral > 100
                                        ? 'bg-rose-500'
                                        : orcamento.percentual_geral > 80
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        }`}
                                    style={{
                                        width: `${Math.min(orcamento.percentual_geral, 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Gastos por Categoria */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Gastos por Categoria
                        </h3>
                        {gastosPorCategoria.length > 0 ? (
                            <div className="flex items-center gap-6">
                                <div className="h-48 w-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={gastosPorCategoria}
                                                dataKey="valor"
                                                nameKey="nome"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                            >
                                                {gastosPorCategoria.map((entry, index) => (
                                                    <Cell key={index} fill={entry.cor} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => formatCurrency(Number(value))}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {gastosPorCategoria.slice(0, 5).map((cat, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: cat.cor }}
                                                />
                                                <span className="text-sm text-gray-600">
                                                    {cat.nome}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {formatCurrency(cat.valor)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">
                                Nenhuma despesa registrada
                            </p>
                        )}
                    </div>

                    {/* Gastos por Pessoa */}
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Gastos por Pessoa
                        </h3>
                        {gastosPorResponsavel.length > 0 ? (
                            <div className="space-y-4">
                                {gastosPorResponsavel.map((pessoa, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                                            style={{ backgroundColor: pessoa.cor }}
                                        >
                                            {pessoa.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900">
                                                    {pessoa.nome}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(pessoa.valor)}
                                                </span>
                                            </div>
                                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        backgroundColor: pessoa.cor,
                                                        width: `${(pessoa.valor /
                                                            Math.max(
                                                                ...gastosPorResponsavel.map(
                                                                    (p) => p.valor,
                                                                ),
                                                            )) *
                                                            100
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">
                                Nenhum gasto atribuído
                            </p>
                        )}
                    </div>
                </div>

                {/* Cartões */}
                {cartoes.length > 0 && (
                    <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold text-white">
                            Cartões de Crédito
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {cartoes.map((cartao) => (
                                <div
                                    key={cartao.id}
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: cartao.cor }}
                                >
                                    <div className="flex items-center justify-between">
                                        <CreditCard className="h-8 w-8 text-white/80" />
                                        <span className="text-sm font-medium text-white/80">
                                            {cartao.bandeira}
                                        </span>
                                    </div>
                                    <p className="mt-4 text-lg font-bold text-white">
                                        {cartao.nome}
                                    </p>
                                    <div className="mt-4 flex justify-between text-sm">
                                        <div>
                                            <p className="text-white/60">Fatura Atual</p>
                                            <p className="font-semibold text-white">
                                                {formatCurrency(cartao.fatura_atual)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/60">Disponível</p>
                                            <p className="font-semibold text-white">
                                                {formatCurrency(cartao.limite_disponivel)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Últimas Transações */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Últimas Transações
                        </h3>
                        <a
                            href="/transacoes"
                            className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700"
                        >
                            Ver todas <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {ultimasTransacoes.length > 0 ? (
                            ultimasTransacoes.slice(0, 5).map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                                            style={{
                                                backgroundColor: t.categoria_cor || '#94a3b8',
                                            }}
                                        >
                                            {t.categoria_icone || '💰'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {t.descricao}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {t.categoria || 'Sem categoria'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`font-semibold ${t.tipo === 'receita'
                                                ? 'text-emerald-600'
                                                : 'text-rose-600'
                                                }`}
                                        >
                                            {t.tipo === 'receita' ? '+' : '-'}
                                            {formatCurrency(t.valor)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(t.data).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="py-4 text-center text-gray-500">
                                Nenhuma transação registrada
                            </p>
                        )}
                    </div>
                </div>

                {/* Metas */}
                {metas.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            Minhas Metas
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {metas.map((meta) => (
                                <div
                                    key={meta.id}
                                    className="rounded-xl border border-gray-100 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lime-100 to-emerald-100 text-2xl">
                                            {meta.icone || '🎯'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {meta.nome}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatCurrency(meta.valor_atual)} /{' '}
                                                {formatCurrency(meta.valor_alvo)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Progresso</span>
                                            <span className="font-medium text-emerald-600">
                                                {meta.progresso.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all"
                                                style={{ width: `${meta.progresso}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
