<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Transacao;
use App\Models\TransacaoSplit;
use App\Services\RecurrenceService;
use App\Services\StatementCycleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransacaoController extends Controller
{
    public function __construct(
        protected RecurrenceService $recurrenceService,
        protected StatementCycleService $cycleService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $mes = $request->get('mes', now()->month);
        $ano = $request->get('ano', now()->year);
        $tipo = $request->get('tipo'); // receita, despesa
        $categoriaId = $request->get('categoria_id');
        $responsavelId = $request->get('responsavel_id');
        $fixa = $request->get('fixa');
        $search = $request->get('search');

        $query = Transacao::where('user_id', $user->id)
            ->with(['categoria', 'subcategoria', 'responsavel', 'conta', 'cartao'])
            ->whereYear('data', $ano)
            ->whereMonth('data', $mes);

        if ($tipo) {
            $query->where('tipo', $tipo);
        }
        if ($categoriaId) {
            $query->where('categoria_id', $categoriaId);
        }
        if ($responsavelId) {
            $query->where('responsavel_id', $responsavelId);
        }
        if ($fixa !== null) {
            $query->where('fixa', $fixa === 'true' || $fixa === '1');
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('descricao', 'like', "%$search%")
                    ->orWhere('descricao_original', 'like', "%$search%");
            });
        }

        $transacoes = $query->orderBy('data', 'desc')
            ->paginate(20)
            ->through(fn($t) => [
                'id' => $t->id,
                'data' => $t->data->format('Y-m-d'),
                'descricao' => $t->descricao_exibicao,
                'descricao_original' => $t->descricao_original,
                'valor' => (float) $t->valor,
                'tipo' => $t->tipo,
                'forma_pagamento' => $t->forma_pagamento,
                'fixa' => $t->fixa,
                'parcelada' => $t->parcelada,
                'parcela_atual' => $t->parcela_atual,
                'parcela_total' => $t->parcela_total,
                'categoria' => $t->categoria ? [
                    'id' => $t->categoria->id,
                    'nome' => $t->categoria->nome,
                    'cor' => $t->categoria->cor,
                    'icone' => $t->categoria->icone,
                ] : null,
                'subcategoria' => $t->subcategoria ? [
                    'id' => $t->subcategoria->id,
                    'nome' => $t->subcategoria->nome,
                ] : null,
                'responsavel' => $t->responsavel ? [
                    'id' => $t->responsavel->id,
                    'nome' => $t->responsavel->nome,
                    'cor' => $t->responsavel->cor,
                ] : null,
                'conta' => $t->conta?->nome,
                'cartao' => $t->cartao?->nome,
                'has_splits' => $t->hasSplits(),
            ]);

        // Categorias e responsáveis para filtros
        $categorias = $user->categorias()->ativas()->get(['id', 'nome', 'tipo', 'cor']);
        $responsaveis = $user->responsaveis()->get(['id', 'nome', 'cor']);

        return Inertia::render('Transacoes/Index', [
            'transacoes' => $transacoes,
            'categorias' => $categorias,
            'responsaveis' => $responsaveis,
            'filtros' => [
                'mes' => $mes,
                'ano' => $ano,
                'tipo' => $tipo,
                'categoria_id' => $categoriaId,
                'responsavel_id' => $responsavelId,
                'fixa' => $fixa,
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'data' => 'required|date',
            'descricao' => 'required|string|max:255',
            'valor' => 'required|numeric|min:0.01',
            'tipo' => 'required|in:receita,despesa,transferencia',
            'categoria_id' => 'nullable|exists:categorias,id',
            'subcategoria_id' => 'nullable|exists:subcategorias,id',
            'responsavel_id' => 'nullable|exists:responsaveis,id',
            'conta_id' => 'nullable|exists:contas,id',
            'cartao_id' => 'nullable|exists:cartoes,id',
            'forma_pagamento' => 'nullable|in:pix,debito,credito,dinheiro,boleto,transferencia',
            'fixa' => 'boolean',
            'parcelada' => 'boolean',
            'parcela_total' => 'nullable|integer|min:2|max:60',
            'observacoes' => 'nullable|string',
        ], [
            'data.required' => 'A data é obrigatória.',
            'descricao.required' => 'A descrição é obrigatória.',
            'valor.required' => 'O valor é obrigatório.',
            'valor.min' => 'O valor deve ser maior que zero.',
            'tipo.required' => 'O tipo é obrigatório.',
        ]);

        $transacao = Transacao::create([
            'user_id' => $user->id,
            'descricao_original' => $validated['descricao'],
            ...$validated,
        ]);

        // Se for cartão de crédito, atribui ao ciclo
        if ($transacao->cartao_id) {
            $cartao = $user->cartoes()->find($transacao->cartao_id);
            if ($cartao) {
                $this->cycleService->atribuirTransacaoAoCiclo($cartao, $transacao);
            }
        }

        // Se for fixa, gera recorrências
        if ($transacao->fixa) {
            $this->recurrenceService->gerarRecorrencias($transacao, 12);
        }

        // Se for parcelada, gera parcelas
        if ($transacao->parcelada && $validated['parcela_total'] > 1) {
            $this->recurrenceService->gerarParcelas($transacao, $validated['parcela_total']);
        }

        AuditLog::registrar(
            $user->id,
            Transacao::class,
            $transacao->id,
            'create',
            null,
            $transacao->toArray()
        );

        return back()->with('success', 'Transação criada com sucesso!');
    }

    public function update(Request $request, Transacao $transacao)
    {
        $this->authorize('update', $transacao);
        $user = $request->user();

        $validated = $request->validate([
            'data' => 'date',
            'descricao' => 'string|max:255',
            'valor' => 'numeric|min:0.01',
            'tipo' => 'in:receita,despesa,transferencia',
            'categoria_id' => 'nullable|exists:categorias,id',
            'subcategoria_id' => 'nullable|exists:subcategorias,id',
            'responsavel_id' => 'nullable|exists:responsaveis,id',
            'forma_pagamento' => 'nullable|in:pix,debito,credito,dinheiro,boleto,transferencia',
            'observacoes' => 'nullable|string',
        ]);

        $oldValues = $transacao->toArray();
        $transacao->update($validated);

        AuditLog::registrar(
            $user->id,
            Transacao::class,
            $transacao->id,
            'update',
            $oldValues,
            $transacao->toArray()
        );

        return back()->with('success', 'Transação atualizada com sucesso!');
    }

    public function destroy(Transacao $transacao)
    {
        $this->authorize('delete', $transacao);
        $user = request()->user();

        $oldValues = $transacao->toArray();
        $transacao->delete();

        AuditLog::registrar(
            $user->id,
            Transacao::class,
            $transacao->id,
            'delete',
            $oldValues,
            null
        );

        return back()->with('success', 'Transação excluída com sucesso!');
    }

    // Split de transação
    public function splits(Transacao $transacao)
    {
        $this->authorize('view', $transacao);

        $splits = $transacao->splits()
            ->with(['categoria', 'subcategoria'])
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'categoria_id' => $s->categoria_id,
                'categoria_nome' => $s->categoria?->nome,
                'subcategoria_id' => $s->subcategoria_id,
                'subcategoria_nome' => $s->subcategoria?->nome,
                'valor' => (float) $s->valor,
                'descricao' => $s->descricao,
            ]);

        return response()->json([
            'transacao_id' => $transacao->id,
            'valor_total' => (float) $transacao->valor,
            'splits' => $splits,
        ]);
    }

    public function saveSplits(Request $request, Transacao $transacao)
    {
        $this->authorize('update', $transacao);
        $user = $request->user();

        $validated = $request->validate([
            'splits' => 'required|array|min:2',
            'splits.*.categoria_id' => 'nullable|exists:categorias,id',
            'splits.*.subcategoria_id' => 'nullable|exists:subcategorias,id',
            'splits.*.valor' => 'required|numeric|min:0.01',
            'splits.*.descricao' => 'nullable|string|max:255',
        ], [
            'splits.required' => 'É necessário informar pelo menos 2 divisões.',
            'splits.min' => 'É necessário informar pelo menos 2 divisões.',
        ]);

        // Valida soma total
        $somaTotal = array_sum(array_column($validated['splits'], 'valor'));
        if (abs($somaTotal - $transacao->valor) > 0.01) {
            return back()->withErrors([
                'splits' => 'A soma das divisões deve ser igual ao valor total da transação.',
            ]);
        }

        // Remove splits anteriores
        $transacao->splits()->delete();

        // Cria novos splits
        foreach ($validated['splits'] as $splitData) {
            TransacaoSplit::create([
                'transacao_id' => $transacao->id,
                ...$splitData,
            ]);
        }

        AuditLog::registrar(
            $user->id,
            Transacao::class,
            $transacao->id,
            'update',
            ['action' => 'splits_updated'],
            ['splits' => $validated['splits']]
        );

        return back()->with('success', 'Divisão salva com sucesso!');
    }
}
