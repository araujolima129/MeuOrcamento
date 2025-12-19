<?php

namespace App\Services;

use App\Models\Transacao;
use Illuminate\Support\Collection;

class DedupeService
{
    /**
     * Gera um hash único para a transação baseado em seus dados.
     * NOTA: Não inclui conta_id/cartao_id para detectar duplicados entre diferentes contas/cartões.
     */
    public function generateHash(array $data): string
    {
        $components = [
            $data['data'] ?? '',
            number_format((float) ($data['valor'] ?? 0), 2, '.', ''),
            $this->normalizeDescription($data['descricao'] ?? ''),
            $data['identificador'] ?? '',
        ];

        return hash('sha256', implode('|', $components));
    }

    /**
     * Normaliza a descrição para comparação.
     */
    protected function normalizeDescription(string $description): string
    {
        // Remove espaços extras
        $desc = preg_replace('/\s+/', ' ', $description);
        // Converte para minúsculas
        $desc = mb_strtolower($desc);
        // Remove caracteres especiais
        $desc = preg_replace('/[^a-z0-9\s]/', '', $desc);
        return trim($desc);
    }

    /**
     * Busca transações duplicadas pelo hash.
     */
    public function findDuplicates(int $userId, string $hash): Collection
    {
        return Transacao::where('user_id', $userId)
            ->where('hash_dedupe', $hash)
            ->get();
    }

    /**
     * Busca transações similares (possíveis duplicatas).
     */
    public function findSimilar(int $userId, array $data): Collection
    {
        $query = Transacao::where('user_id', $userId)
            ->where('data', $data['data'])
            ->where('valor', $data['valor']);

        // Se tem identificador externo, usa ele
        if (!empty($data['identificador'])) {
            $query->where('identificador_externo', $data['identificador']);
        }

        return $query->get();
    }

    /**
     * Verifica se uma transação é duplicata.
     */
    public function isDuplicate(int $userId, string $hash): bool
    {
        return Transacao::where('user_id', $userId)
            ->where('hash_dedupe', $hash)
            ->exists();
    }

    /**
     * Gera hash para uma transação existente e atualiza.
     */
    public function updateHash(Transacao $transacao): void
    {
        $hash = $this->generateHash([
            'data' => $transacao->data->format('Y-m-d'),
            'valor' => $transacao->valor,
            'descricao' => $transacao->descricao_original,
            'identificador' => $transacao->identificador_externo,
        ]);

        $transacao->hash_dedupe = $hash;
        $transacao->save();
    }

    /**
     * Recalcula hash para todas as transações do usuário.
     */
    public function recalculateAllHashes(int $userId): int
    {
        $count = 0;

        Transacao::where('user_id', $userId)
            ->whereNull('hash_dedupe')
            ->chunk(100, function ($transacoes) use (&$count) {
                foreach ($transacoes as $transacao) {
                    $this->updateHash($transacao);
                    $count++;
                }
            });

        return $count;
    }
}
