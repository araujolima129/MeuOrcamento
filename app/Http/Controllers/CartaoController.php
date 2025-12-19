<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Cartao;
use App\Models\CicloFatura;
use App\Models\Conta;
use App\Services\StatementCycleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartaoController extends Controller
{
    public function __construct(
        protected StatementCycleService $cycleService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Contas
        $contas = $user->contas()->get()->map(fn($c) => [
            'id' => $c->id,
            'nome' => $c->nome,
            'banco' => $c->banco,
            'cor' => $c->cor,
            'saldo_inicial' => (float) $c->saldo_inicial,
            'saldo_atual' => (float) $c->saldo_atual,
            'ativo' => $c->ativo,
        ]);

        // Cartões com ciclos
        $cartoes = $user->cartoes()->with([
            'ciclos' => function ($q) {
                $q->orderBy('ano', 'desc')->orderBy('mes', 'desc')->limit(3);
            }
        ])->get()->map(fn($c) => [
                'id' => $c->id,
                'nome' => $c->nome,
                'bandeira' => $c->bandeira,
                'final' => $c->final,
                'limite' => (float) $c->limite,
                'limite_disponivel' => (float) $c->limite_disponivel,
                'dia_fechamento' => $c->dia_fechamento,
                'dia_vencimento' => $c->dia_vencimento,
                'cor' => $c->cor,
                'ativo' => $c->ativo,
                'ciclos' => $c->ciclos->map(fn($ciclo) => [
                    'id' => $ciclo->id,
                    'mes' => $ciclo->mes,
                    'ano' => $ciclo->ano,
                    'data_vencimento' => $ciclo->data_vencimento->format('d/m/Y'),
                    'status' => $ciclo->status,
                    'valor_total' => (float) $ciclo->valor_total,
                ]),
            ]);

        return Inertia::render('Cartoes/Index', [
            'contas' => $contas,
            'cartoes' => $cartoes,
        ]);
    }

    // CRUD Contas
    public function storeConta(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nome' => 'required|string|max:100',
            'banco' => 'nullable|string|max:100',
            'agencia' => 'nullable|string|max:20',
            'numero' => 'nullable|string|max:30',
            'saldo_inicial' => 'nullable|numeric',
            'cor' => 'nullable|string|max:7',
        ]);

        $conta = Conta::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return back()->with('success', 'Conta criada com sucesso!');
    }

    public function updateConta(Request $request, Conta $conta)
    {
        $this->authorize('update', $conta);

        $validated = $request->validate([
            'nome' => 'string|max:100',
            'banco' => 'nullable|string|max:100',
            'agencia' => 'nullable|string|max:20',
            'numero' => 'nullable|string|max:30',
            'saldo_inicial' => 'nullable|numeric',
            'cor' => 'nullable|string|max:7',
            'ativo' => 'boolean',
        ]);

        $conta->update($validated);

        return back()->with('success', 'Conta atualizada com sucesso!');
    }

    public function destroyConta(Conta $conta)
    {
        $this->authorize('delete', $conta);

        $conta->delete();

        return back()->with('success', 'Conta excluída com sucesso!');
    }

    // CRUD Cartões
    public function storeCartao(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nome' => 'required|string|max:100',
            'bandeira' => 'nullable|string|max:50',
            'final' => 'nullable|string|max:4',
            'limite' => 'nullable|numeric|min:0',
            'dia_fechamento' => 'required|integer|min:1|max:31',
            'dia_vencimento' => 'required|integer|min:1|max:31',
            'cor' => 'nullable|string|max:7',
        ], [
            'dia_fechamento.required' => 'Informe o dia de fechamento.',
            'dia_vencimento.required' => 'Informe o dia de vencimento.',
        ]);

        $cartao = Cartao::create([
            'user_id' => $user->id,
            'limite' => $validated['limite'] ?? 0,
            ...$validated,
        ]);

        // Gera ciclos futuros
        $this->cycleService->gerarCiclosFuturos($cartao, 3);

        return back()->with('success', 'Cartão criado com sucesso!');
    }

    public function updateCartao(Request $request, Cartao $cartao)
    {
        $this->authorize('update', $cartao);

        $validated = $request->validate([
            'nome' => 'string|max:100',
            'bandeira' => 'nullable|string|max:50',
            'final' => 'nullable|string|max:4',
            'limite' => 'nullable|numeric|min:0',
            'dia_fechamento' => 'integer|min:1|max:31',
            'dia_vencimento' => 'integer|min:1|max:31',
            'cor' => 'nullable|string|max:7',
            'ativo' => 'boolean',
        ]);

        $cartao->update($validated);

        return back()->with('success', 'Cartão atualizado com sucesso!');
    }

    public function destroyCartao(Cartao $cartao)
    {
        $this->authorize('delete', $cartao);

        $cartao->delete();

        return back()->with('success', 'Cartão excluído com sucesso!');
    }

    // Ciclos de Fatura
    public function ciclos(Cartao $cartao)
    {
        $this->authorize('view', $cartao);

        $ciclos = $cartao->ciclos()
            ->orderBy('ano', 'desc')
            ->orderBy('mes', 'desc')
            ->paginate(12)
            ->through(fn($c) => [
                'id' => $c->id,
                'mes' => $c->mes,
                'ano' => $c->ano,
                'data_inicio' => $c->data_inicio->format('d/m/Y'),
                'data_fim' => $c->data_fim->format('d/m/Y'),
                'data_vencimento' => $c->data_vencimento->format('d/m/Y'),
                'status' => $c->status,
                'valor_total' => (float) $c->valor_total,
            ]);

        return response()->json($ciclos);
    }

    public function fecharCiclo(CicloFatura $ciclo)
    {
        $cartao = $ciclo->cartao;
        $this->authorize('update', $cartao);

        $this->cycleService->fecharCiclo($ciclo);

        return back()->with('success', 'Fatura fechada com sucesso!');
    }

    public function pagarCiclo(CicloFatura $ciclo)
    {
        $cartao = $ciclo->cartao;
        $this->authorize('update', $cartao);

        $this->cycleService->pagarCiclo($ciclo);

        return back()->with('success', 'Fatura marcada como paga!');
    }
}
