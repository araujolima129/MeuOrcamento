<?php

namespace App\Http\Controllers;

use App\Models\Orcamento;
use App\Services\BudgetService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrcamentoController extends Controller
{
    public function __construct(
        protected BudgetService $budgetService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $mes = $request->get('mes', now()->month);
        $ano = $request->get('ano', now()->year);

        $resumo = $this->budgetService->getResumoMensal($user->id, $mes, $ano);

        // Categorias do usuário para adicionar novos orçamentos
        $categorias = $user->categorias()
            ->where('tipo', 'despesa')
            ->with('subcategorias')
            ->ativas()
            ->get(['id', 'nome', 'cor', 'icone']);

        return Inertia::render('Orcamento/Index', [
            'resumo' => $resumo,
            'categorias' => $categorias,
            'mes' => $mes,
            'ano' => $ano,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'categoria_id' => 'required|exists:categorias,id',
            'subcategoria_id' => 'nullable|exists:subcategorias,id',
            'mes' => 'required|integer|min:1|max:12',
            'ano' => 'required|integer|min:2020|max:2100',
            'valor_planejado' => 'required|numeric|min:0',
            'protegido' => 'boolean',
        ], [
            'categoria_id.required' => 'Selecione uma categoria.',
            'mes.required' => 'O mês é obrigatório.',
            'ano.required' => 'O ano é obrigatório.',
            'valor_planejado.required' => 'O valor planejado é obrigatório.',
        ]);

        // Verifica se já existe
        $exists = Orcamento::where('user_id', $user->id)
            ->where('categoria_id', $validated['categoria_id'])
            ->where('subcategoria_id', $validated['subcategoria_id'])
            ->where('mes', $validated['mes'])
            ->where('ano', $validated['ano'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['categoria_id' => 'Já existe orçamento para esta categoria/subcategoria neste mês.']);
        }

        Orcamento::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return back()->with('success', 'Orçamento criado com sucesso!');
    }

    public function update(Request $request, Orcamento $orcamento)
    {
        $this->authorize('update', $orcamento);

        $validated = $request->validate([
            'valor_planejado' => 'required|numeric|min:0',
            'protegido' => 'boolean',
        ]);

        $orcamento->update($validated);

        return back()->with('success', 'Orçamento atualizado com sucesso!');
    }

    public function destroy(Orcamento $orcamento)
    {
        $this->authorize('delete', $orcamento);

        $orcamento->delete();

        return back()->with('success', 'Orçamento excluído com sucesso!');
    }

    public function copiar(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'mes_origem' => 'required|integer|min:1|max:12',
            'ano_origem' => 'required|integer|min:2020|max:2100',
            'mes_destino' => 'required|integer|min:1|max:12',
            'ano_destino' => 'required|integer|min:2020|max:2100',
        ]);

        $count = $this->budgetService->copiarOrcamento(
            $user->id,
            $validated['mes_origem'],
            $validated['ano_origem'],
            $validated['mes_destino'],
            $validated['ano_destino']
        );

        return back()->with('success', "Copiados $count orçamentos com sucesso!");
    }

    public function sugerirRedistribuicao(Request $request)
    {
        $user = $request->user();
        $mes = $request->get('mes', now()->month);
        $ano = $request->get('ano', now()->year);

        $sugestao = $this->budgetService->sugerirRedistribuicao($user->id, $mes, $ano);

        return response()->json($sugestao);
    }

    public function aplicarRedistribuicao(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'transferencias' => 'required|array',
            'transferencias.*.origem_categoria_id' => 'required|exists:categorias,id',
            'transferencias.*.destino_categoria_id' => 'required|exists:categorias,id',
            'transferencias.*.valor' => 'required|numeric|min:0.01',
        ]);

        $this->budgetService->aplicarRedistribuicao($user->id, $validated['transferencias']);

        return back()->with('success', 'Redistribuição aplicada com sucesso!');
    }
}
