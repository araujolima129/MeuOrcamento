<?php

namespace App\Http\Controllers;

use App\Models\Cartao;
use App\Models\Categoria;
use App\Models\Meta;
use App\Models\Transacao;
use App\Services\BudgetService;
use App\Services\StatementCycleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        protected BudgetService $budgetService,
        protected StatementCycleService $cycleService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $mes = $request->get('mes', now()->month);
        $ano = $request->get('ano', now()->year);

        // Fecha automaticamente ciclos de fatura que já passaram
        $this->cycleService->fecharCiclosAutomaticamente($user->id);

        // Resumo do orçamento
        $orcamento = $this->budgetService->getResumoMensal($user->id, $mes, $ano);

        // Gastos por categoria (para gráfico)
        $gastosPorCategoria = Transacao::where('user_id', $user->id)
            ->where('tipo', 'despesa')
            ->whereYear('data', $ano)
            ->whereMonth('data', $mes)
            ->with('categoria')
            ->selectRaw('categoria_id, SUM(valor) as total')
            ->groupBy('categoria_id')
            ->get()
            ->map(fn($item) => [
                'categoria_id' => $item->categoria_id,
                'nome' => $item->categoria?->nome ?? 'Sem categoria',
                'cor' => $item->categoria?->cor ?? '#94a3b8',
                'valor' => (float) $item->total,
            ]);

        // Gastos por responsável
        $gastosPorResponsavel = Transacao::where('user_id', $user->id)
            ->where('tipo', 'despesa')
            ->whereYear('data', $ano)
            ->whereMonth('data', $mes)
            ->with('responsavel')
            ->selectRaw('responsavel_id, SUM(valor) as total')
            ->groupBy('responsavel_id')
            ->get()
            ->map(fn($item) => [
                'responsavel_id' => $item->responsavel_id,
                'nome' => $item->responsavel?->nome ?? 'Não atribuído',
                'cor' => $item->responsavel?->cor ?? '#94a3b8',
                'avatar' => $item->responsavel?->avatar,
                'valor' => (float) $item->total,
            ]);

        // Cartões com faturas abertas
        $cartoes = Cartao::where('user_id', $user->id)
            ->where('ativo', true)
            ->with([
                'ciclos' => function ($q) {
                    $q->whereIn('status', ['aberta', 'fechada'])->orderBy('data_vencimento');
                }
            ])
            ->get()
            ->map(fn($cartao) => [
                'id' => $cartao->id,
                'nome' => $cartao->nome,
                'bandeira' => $cartao->bandeira,
                'final' => $cartao->final,
                'cor' => $cartao->cor,
                'limite' => (float) $cartao->limite,
                'limite_disponivel' => (float) $cartao->limite_disponivel,
                'fatura_atual' => $cartao->ciclos->first()?->valor_total ?? 0,
            ]);

        // Metas ativas com progresso
        $metas = Meta::where('user_id', $user->id)
            ->where('status', 'ativa')
            ->get()
            ->map(fn($meta) => [
                'id' => $meta->id,
                'nome' => $meta->nome,
                'icone' => $meta->icone,
                'valor_alvo' => (float) $meta->valor_alvo,
                'valor_atual' => (float) $meta->valor_atual,
                'progresso' => $meta->progresso,
            ]);

        // Últimas transações
        $ultimasTransacoes = Transacao::where('user_id', $user->id)
            ->with(['categoria', 'subcategoria', 'responsavel'])
            ->orderBy('data', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'data' => $t->data->format('Y-m-d'),
                'descricao' => $t->descricao_exibicao,
                'valor' => (float) $t->valor,
                'tipo' => $t->tipo,
                'categoria' => $t->categoria?->nome,
                'categoria_cor' => $t->categoria?->cor,
                'categoria_icone' => $t->categoria?->icone,
            ]);

        // Receitas x Despesas do mês (exclui transações de cartão, apenas faturas consolidadas contam)
        $totalReceitas = Transacao::where('user_id', $user->id)
            ->where('tipo', 'receita')
            ->whereYear('data', $ano)
            ->whereMonth('data', $mes)
            ->whereNull('cartao_id') // Exclui transações de cartão
            ->sum('valor');

        $totalDespesas = Transacao::where('user_id', $user->id)
            ->where('tipo', 'despesa')
            ->whereYear('data', $ano)
            ->whereMonth('data', $mes)
            ->whereNull('cartao_id') // Exclui transações de cartão
            ->sum('valor');

        return Inertia::render('Dashboard', [
            'mes' => $mes,
            'ano' => $ano,
            'orcamento' => $orcamento,
            'gastosPorCategoria' => $gastosPorCategoria,
            'gastosPorResponsavel' => $gastosPorResponsavel,
            'cartoes' => $cartoes,
            'metas' => $metas,
            'ultimasTransacoes' => $ultimasTransacoes,
            'resumo' => [
                'receitas' => (float) $totalReceitas,
                'despesas' => (float) $totalDespesas,
                'saldo' => (float) ($totalReceitas - $totalDespesas),
            ],
        ]);
    }
}
