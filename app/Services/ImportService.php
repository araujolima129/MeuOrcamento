<?php

namespace App\Services;

use App\Models\Importacao;
use App\Models\ImportacaoItem;
use App\Models\Transacao;
use App\Services\Parsers\CsvParser;
use App\Services\Parsers\OfxParser;
use App\Services\Parsers\ParserInterface;
use App\Services\Parsers\TxtParser;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class ImportService
{
    protected array $parsers = [];
    protected DedupeService $dedupeService;

    public function __construct(DedupeService $dedupeService)
    {
        $this->dedupeService = $dedupeService;
        $this->parsers = [
            new OfxParser(),
            new CsvParser(),
            new TxtParser(),
        ];
    }

    /**
     * Detecta o tipo do arquivo.
     */
    public function detectType(UploadedFile $file): string
    {
        $content = file_get_contents($file->getRealPath());

        foreach ($this->parsers as $parser) {
            if ($parser->supports($content)) {
                return $parser->getType();
            }
        }

        // Fallback baseado na extensão
        $extension = strtolower($file->getClientOriginalExtension());
        return match ($extension) {
            'ofx', 'qfx' => 'ofx',
            'csv' => 'csv',
            default => 'txt',
        };
    }

    /**
     * Armazena o arquivo e cria a importação.
     */
    public function createImportacao(
        int $userId,
        UploadedFile $file,
        ?int $contaId = null,
        ?int $cartaoId = null
    ): Importacao {
        // Armazena o arquivo de forma privada
        $path = $file->store("imports/$userId", 'local');
        $tipo = $this->detectType($file);

        return Importacao::create([
            'user_id' => $userId,
            'conta_id' => $contaId,
            'cartao_id' => $cartaoId,
            'arquivo_original' => $file->getClientOriginalName(),
            'arquivo_path' => $path,
            'tipo' => $tipo,
            'status' => 'pendente',
        ]);
    }

    /**
     * Faz preview das transações sem salvar.
     */
    public function preview(Importacao $importacao, ?array $mapping = null): Collection
    {
        $content = Storage::disk('local')->get($importacao->arquivo_path);
        $parser = $this->getParser($importacao->tipo);

        $transactions = $parser->parse($content, $mapping);

        return collect($transactions)->map(function ($t, $index) use ($importacao) {
            $hash = $this->dedupeService->generateHash([
                'data' => $t['data'],
                'valor' => $t['valor'],
                'descricao' => $t['descricao'],
                'identificador' => $t['identificador'] ?? null,
                'conta_id' => $importacao->conta_id,
                'cartao_id' => $importacao->cartao_id,
            ]);

            $duplicates = $this->dedupeService->findDuplicates(
                $importacao->user_id,
                $hash
            );

            return [
                'index' => $index,
                'data' => $t['data'],
                'descricao' => $t['descricao'],
                'valor' => $t['valor'],
                'tipo' => $t['tipo'],
                'identificador' => $t['identificador'] ?? null,
                'hash' => $hash,
                'is_duplicate' => $duplicates->isNotEmpty(),
                'duplicate_ids' => $duplicates->pluck('id')->toArray(),
            ];
        });
    }

    /**
     * Sugere mapeamento para CSV.
     */
    public function suggestMapping(Importacao $importacao): array
    {
        if ($importacao->tipo !== 'csv') {
            return [];
        }

        $content = Storage::disk('local')->get($importacao->arquivo_path);
        $parser = new CsvParser();

        return $parser->suggestMapping($content);
    }

    /**
     * Processa a importação em lotes.
     */
    public function processInBatches(
        Importacao $importacao,
        array $selectedIndexes,
        ?array $mapping = null,
        int $batchSize = 50
    ): void {
        $importacao->status = 'processando';
        $importacao->save();

        try {
            $content = Storage::disk('local')->get($importacao->arquivo_path);
            $parser = $this->getParser($importacao->tipo);
            $transactions = $parser->parse($content, $mapping);

            // Salva o mapeamento se for CSV/TXT
            if ($mapping && in_array($importacao->tipo, ['csv', 'txt'])) {
                $importacao->mapeamento = $mapping;
                $importacao->save();
            }

            // Cria os itens de importação
            $items = [];
            foreach ($transactions as $index => $t) {
                if (!in_array($index, $selectedIndexes)) {
                    continue;
                }

                $hash = $this->dedupeService->generateHash([
                    'data' => $t['data'],
                    'valor' => $t['valor'],
                    'descricao' => $t['descricao'],
                    'identificador' => $t['identificador'] ?? null,
                    'conta_id' => $importacao->conta_id,
                    'cartao_id' => $importacao->cartao_id,
                ]);

                $items[] = ImportacaoItem::create([
                    'importacao_id' => $importacao->id,
                    'dados_originais' => $t,
                    'hash_dedupe' => $hash,
                    'status' => 'pendente',
                ]);
            }

            // Processa em lotes
            $chunks = array_chunk($items, $batchSize);
            foreach ($chunks as $chunk) {
                $this->processBatch($importacao, $chunk);
            }

            $importacao->marcarConcluida();

        } catch (Exception $e) {
            $importacao->status = 'falhou';
            $importacao->log = $e->getMessage();
            $importacao->save();
            throw $e;
        }
    }

    protected function processBatch(Importacao $importacao, array $items): void
    {
        foreach ($items as $item) {
            try {
                // Verifica duplicatas
                $duplicates = $this->dedupeService->findDuplicates(
                    $importacao->user_id,
                    $item->hash_dedupe
                );

                if ($duplicates->isNotEmpty()) {
                    $item->marcarDuplicado();
                    continue;
                }

                // Cria a transação
                $data = $item->dados_originais;
                $transacao = Transacao::create([
                    'user_id' => $importacao->user_id,
                    'conta_id' => $importacao->conta_id,
                    'cartao_id' => $importacao->cartao_id,
                    'data' => $data['data'],
                    'data_competencia' => $data['data'],
                    'descricao_original' => $data['descricao'],
                    'valor' => $data['valor'],
                    'tipo' => $data['tipo'],
                    'identificador_externo' => $data['identificador'] ?? null,
                    'hash_dedupe' => $item->hash_dedupe,
                ]);

                $item->marcarImportado($transacao);

            } catch (Exception $e) {
                $item->marcarErro($e->getMessage());
            }
        }
    }

    protected function getParser(string $tipo): ParserInterface
    {
        foreach ($this->parsers as $parser) {
            if ($parser->getType() === $tipo) {
                return $parser;
            }
        }

        throw new Exception("Parser não encontrado para tipo: $tipo");
    }
}
