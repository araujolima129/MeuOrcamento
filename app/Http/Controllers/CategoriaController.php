<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Subcategoria;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $tipo = $request->get('tipo'); // 'receita' ou 'despesa'

        $query = Categoria::where('user_id', $user->id)
            ->with(['subcategorias' => fn($q) => $q->orderBy('nome')])
            ->orderBy('nome');

        if ($tipo) {
            $query->where('tipo', $tipo);
        }

        $categorias = $query->get()->map(fn($cat) => [
            'id' => $cat->id,
            'nome' => $cat->nome,
            'icone' => $cat->icone,
            'cor' => $cat->cor,
            'tipo' => $cat->tipo,
            'ativo' => $cat->ativo,
            'subcategorias' => $cat->subcategorias->map(fn($sub) => [
                'id' => $sub->id,
                'nome' => $sub->nome,
                'icone' => $sub->icone,
                'ativo' => $sub->ativo,
            ]),
        ]);

        return Inertia::render('Categorias/Index', [
            'categorias' => $categorias,
            'filtroTipo' => $tipo,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nome' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categorias')->where(
                    fn($q) =>
                    $q->where('user_id', $user->id)->where('tipo', $request->tipo)
                ),
            ],
            'icone' => 'nullable|string|max:50',
            'cor' => 'nullable|string|max:7',
            'tipo' => 'required|in:receita,despesa',
        ], [
            'nome.required' => 'O nome da categoria é obrigatório.',
            'nome.unique' => 'Já existe uma categoria com este nome.',
            'tipo.required' => 'O tipo é obrigatório.',
            'tipo.in' => 'Tipo inválido.',
        ]);

        $categoria = Categoria::create([
            'user_id' => $user->id,
            ...$validated,
        ]);

        AuditLog::registrar(
            $user->id,
            Categoria::class,
            $categoria->id,
            'create',
            null,
            $categoria->toArray()
        );

        return back()->with('success', 'Categoria criada com sucesso!');
    }

    public function update(Request $request, Categoria $categoria)
    {
        $this->authorize('update', $categoria);
        $user = $request->user();

        $validated = $request->validate([
            'nome' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categorias')->where(
                    fn($q) =>
                    $q->where('user_id', $user->id)->where('tipo', $categoria->tipo)
                )->ignore($categoria->id),
            ],
            'icone' => 'nullable|string|max:50',
            'cor' => 'nullable|string|max:7',
            'ativo' => 'boolean',
        ]);

        $oldValues = $categoria->toArray();
        $categoria->update($validated);

        AuditLog::registrar(
            $user->id,
            Categoria::class,
            $categoria->id,
            'update',
            $oldValues,
            $categoria->toArray()
        );

        return back()->with('success', 'Categoria atualizada com sucesso!');
    }

    public function destroy(Categoria $categoria)
    {
        $this->authorize('delete', $categoria);
        $user = request()->user();

        $oldValues = $categoria->toArray();
        $categoria->delete();

        AuditLog::registrar(
            $user->id,
            Categoria::class,
            $categoria->id,
            'delete',
            $oldValues,
            null
        );

        return back()->with('success', 'Categoria excluída com sucesso!');
    }

    // Subcategorias
    public function storeSubcategoria(Request $request, Categoria $categoria)
    {
        $this->authorize('update', $categoria);
        $user = $request->user();

        $validated = $request->validate([
            'nome' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subcategorias')->where(
                    fn($q) =>
                    $q->where('categoria_id', $categoria->id)
                ),
            ],
            'icone' => 'nullable|string|max:50',
        ], [
            'nome.required' => 'O nome da subcategoria é obrigatório.',
            'nome.unique' => 'Já existe uma subcategoria com este nome.',
        ]);

        $subcategoria = $categoria->subcategorias()->create($validated);

        AuditLog::registrar(
            $user->id,
            Subcategoria::class,
            $subcategoria->id,
            'create',
            null,
            $subcategoria->toArray()
        );

        return back()->with('success', 'Subcategoria criada com sucesso!');
    }

    public function updateSubcategoria(Request $request, Subcategoria $subcategoria)
    {
        $categoria = $subcategoria->categoria;
        $this->authorize('update', $categoria);
        $user = $request->user();

        $validated = $request->validate([
            'nome' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subcategorias')->where(
                    fn($q) =>
                    $q->where('categoria_id', $categoria->id)
                )->ignore($subcategoria->id),
            ],
            'icone' => 'nullable|string|max:50',
            'ativo' => 'boolean',
        ]);

        $oldValues = $subcategoria->toArray();
        $subcategoria->update($validated);

        AuditLog::registrar(
            $user->id,
            Subcategoria::class,
            $subcategoria->id,
            'update',
            $oldValues,
            $subcategoria->toArray()
        );

        return back()->with('success', 'Subcategoria atualizada com sucesso!');
    }

    public function destroySubcategoria(Subcategoria $subcategoria)
    {
        $categoria = $subcategoria->categoria;
        $this->authorize('delete', $categoria);
        $user = request()->user();

        $oldValues = $subcategoria->toArray();
        $subcategoria->delete();

        AuditLog::registrar(
            $user->id,
            Subcategoria::class,
            $subcategoria->id,
            'delete',
            $oldValues,
            null
        );

        return back()->with('success', 'Subcategoria excluída com sucesso!');
    }
}
