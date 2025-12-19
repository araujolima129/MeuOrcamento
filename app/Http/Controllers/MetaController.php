<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Meta;
use App\Models\MetaAporte;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MetaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $status = $request->get('status');

        $query = Meta::where('user_id', $user->id)
            ->withSum('aportes', 'valor');

        if ($status) {
            $query->where('status', $status);
        }

        $metas = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'nome' => $m->nome,
                'descricao' => $m->descricao,
                'icone' => $m->icone,
                'valor_alvo' => (float) $m->valor_alvo,
                'valor_condicao_parcelas' => $m->valor_condicao_parcelas ? (float) $m->valor_condicao_parcelas : null,
                'valor_atual' => (float) $m->valor_atual,
                'progresso' => $m->progresso,
                'data_limite' => $m->data_limite?->format('Y-m-d'),
                'status' => $m->status,
                'atingida' => $m->atingida,
            ]);

        return Inertia::render('Metas/Index', [
            'metas' => $metas,
            'filtroStatus' => $status,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nome' => 'required|string|max:150',
            'descricao' => 'nullable|string|max:500',
            'icone' => 'nullable|string|max:50',
            'valor_alvo' => 'required|numeric|min:0.01',
            'valor_condicao_parcelas' => 'nullable|numeric|min:0',
            'data_limite' => 'nullable|date',
        ], [
            'nome.required' => 'O nome da meta é obrigatório.',
            'valor_alvo.required' => 'O valor alvo é obrigatório.',
            'valor_alvo.min' => 'O valor alvo deve ser maior que zero.',
        ]);

        Meta::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        return back()->with('success', 'Meta criada com sucesso!');
    }

    public function update(Request $request, Meta $meta)
    {
        $this->authorize('update', $meta);

        $validated = $request->validate([
            'nome' => 'string|max:150',
            'descricao' => 'nullable|string|max:500',
            'icone' => 'nullable|string|max:50',
            'valor_alvo' => 'numeric|min:0.01',
            'valor_condicao_parcelas' => 'nullable|numeric|min:0',
            'data_limite' => 'nullable|date',
            'status' => 'in:ativa,atingida,cancelada',
        ]);

        $meta->update($validated);

        return back()->with('success', 'Meta atualizada com sucesso!');
    }

    public function destroy(Meta $meta)
    {
        $this->authorize('delete', $meta);

        $meta->delete();

        return back()->with('success', 'Meta excluída com sucesso!');
    }

    // Aportes
    public function aportes(Meta $meta)
    {
        $this->authorize('view', $meta);

        $aportes = $meta->aportes()
            ->orderBy('data', 'desc')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'data' => $a->data->format('Y-m-d'),
                'valor' => (float) $a->valor,
                'observacao' => $a->observacao,
            ]);

        return response()->json([
            'meta_id' => $meta->id,
            'valor_atual' => $meta->valor_atual,
            'progresso' => $meta->progresso,
            'aportes' => $aportes,
        ]);
    }

    public function storeAporte(Request $request, Meta $meta)
    {
        $this->authorize('update', $meta);

        $validated = $request->validate([
            'data' => 'required|date',
            'valor' => 'required|numeric|min:0.01',
            'observacao' => 'nullable|string|max:255',
        ], [
            'data.required' => 'A data é obrigatória.',
            'valor.required' => 'O valor é obrigatório.',
            'valor.min' => 'O valor deve ser maior que zero.',
        ]);

        $meta->aportes()->create($validated);

        return back()->with('success', 'Aporte registrado com sucesso!');
    }

    public function destroyAporte(MetaAporte $aporte)
    {
        $meta = $aporte->meta;
        $this->authorize('delete', $meta);

        $aporte->delete();

        return back()->with('success', 'Aporte excluído com sucesso!');
    }
}
