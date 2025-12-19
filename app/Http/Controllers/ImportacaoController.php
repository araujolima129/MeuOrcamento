<?php

namespace App\Http\Controllers;

use App\Models\Importacao;
use App\Services\ImportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ImportacaoController extends Controller
{
    public function __construct(
        protected ImportService $importService
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $importacoes = Importacao::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(fn($i) => [
                'id' => $i->id,
                'nome' => $i->nome,
                'arquivo_original' => $i->arquivo_original,
                'tipo' => $i->tipo,
                'status' => $i->status,
                'total_itens' => $i->total_itens,
                'itens_importados' => $i->itens_importados,
                'itens_duplicados' => $i->itens_duplicados,
                'itens_erro' => $i->itens_erro,
                'progresso' => $i->progresso,
                'conta' => $i->conta?->nome,
                'cartao' => $i->cartao?->nome,
                'created_at' => $i->created_at->format('d/m/Y H:i'),
            ]);

        $contas = $user->contas()->ativas()->get(['id', 'nome']);
        $cartoes = $user->cartoes()->ativos()->get(['id', 'nome']);

        return Inertia::render('Importar/Index', [
            'importacoes' => $importacoes,
            'contas' => $contas,
            'cartoes' => $cartoes,
        ]);
    }

    public function upload(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'arquivo' => 'required|file|max:10240|mimes:ofx,qfx,csv,txt',
            'conta_id' => 'nullable|exists:contas,id|required_without:cartao_id',
            'cartao_id' => 'nullable|exists:cartoes,id|required_without:conta_id',
        ], [
            'arquivo.required' => 'Selecione um arquivo para importar.',
            'arquivo.max' => 'O arquivo deve ter no máximo 10MB.',
            'arquivo.mimes' => 'Formato inválido. Use OFX, CSV ou TXT.',
            'conta_id.required_without' => 'Selecione uma conta ou um cartão para vincular.',
            'cartao_id.required_without' => 'Selecione uma conta ou um cartão para vincular.',
        ]);

        $importacao = $this->importService->createImportacao(
            $user->id,
            $request->file('arquivo'),
            $validated['conta_id'] ?? null,
            $validated['cartao_id'] ?? null
        );

        return redirect()->route('importar.preview', $importacao);
    }

    public function preview(Request $request, Importacao $importacao)
    {
        $this->authorize('view', $importacao);

        $mapping = $importacao->mapeamento;

        // Sugere mapeamento para CSV
        if ($importacao->tipo === 'csv' && !$mapping) {
            $mapping = $this->importService->suggestMapping($importacao);
        }

        $transactions = $this->importService->preview($importacao, $mapping);

        return Inertia::render('Importar/Preview', [
            'importacao' => [
                'id' => $importacao->id,
                'arquivo_original' => $importacao->arquivo_original,
                'tipo' => $importacao->tipo,
                'conta' => $importacao->conta?->nome,
                'cartao' => $importacao->cartao?->nome,
            ],
            'transacoes' => $transactions,
            'mapeamento' => $mapping,
            'needsMapping' => in_array($importacao->tipo, ['csv', 'txt']) && !$importacao->mapeamento,
        ]);
    }

    public function saveMapping(Request $request, Importacao $importacao)
    {
        $this->authorize('update', $importacao);

        $validated = $request->validate([
            'mapeamento' => 'required|array',
            'mapeamento.data' => 'required|integer|min:0',
            'mapeamento.descricao' => 'required|integer|min:0',
            'mapeamento.valor' => 'required|integer|min:0',
            'mapeamento.tipo' => 'nullable|integer|min:0',
            'mapeamento.identificador' => 'nullable|integer|min:0',
            'mapeamento.date_format' => 'nullable|string',
            'mapeamento.skip_header' => 'boolean',
        ]);

        $importacao->mapeamento = $validated['mapeamento'];
        $importacao->save();

        return back()->with('success', 'Mapeamento salvo!');
    }

    public function processar(Request $request, Importacao $importacao)
    {
        $this->authorize('update', $importacao);

        $validated = $request->validate([
            'selected' => 'required|array',
            'selected.*' => 'integer',
            'mapeamento' => 'nullable|array',
        ], [
            'selected.required' => 'Selecione pelo menos uma transação.',
        ]);

        $mapping = $validated['mapeamento'] ?? $importacao->mapeamento;

        $this->importService->processInBatches(
            $importacao,
            $validated['selected'],
            $mapping
        );

        return redirect()->route('importar.index')
            ->with('success', 'Importação processada com sucesso!');
    }

    public function status(Importacao $importacao)
    {
        $this->authorize('view', $importacao);

        return response()->json([
            'status' => $importacao->status,
            'progresso' => $importacao->progresso,
            'total_itens' => $importacao->total_itens,
            'itens_importados' => $importacao->itens_importados,
            'itens_duplicados' => $importacao->itens_duplicados,
            'itens_erro' => $importacao->itens_erro,
        ]);
    }

    public function rename(Request $request, Importacao $importacao)
    {
        $this->authorize('update', $importacao);

        $validated = $request->validate([
            'nome' => 'required|string|max:255',
        ], [
            'nome.required' => 'O nome é obrigatório.',
            'nome.max' => 'O nome deve ter no máximo 255 caracteres.',
        ]);

        $importacao->update(['nome' => $validated['nome']]);

        return back()->with('success', 'Nome atualizado com sucesso!');
    }
}
