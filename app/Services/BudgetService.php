<?php

namespace App\Services;

use App\Models\Categoria;
use App\Models\Orcamento;
use App\Models\Transacao;
use App\Models\TransferenciaOrcamento;
use App\Models\User;
use Illuminate\Support\Collection;

class BudgetService
{
    /**
     * Obtém o resumo do orçamento mensal do usuário.
     */
    public function getResumoMensal(int $userId, int $mes, int $ano): array
    {
        $orcamentos = Orcamento::where('user_id', $userId)
            ->where('mes', $mes)
            ->where('ano', $ano)
            ->with(['categoria', 'subcategoria'])
            ->get();

        $totalPlanejado = $orcamentos->sum('valor_planejado');
        $totalRealizado = 0;
        $categorias = [];

        foreach ($orcamentos as $orcamento) {
            $realizado = $orcamento->valor_realizado;
            $totalRealizado += $realizado;

            $key = $orcamento->categoria_id . '-' . ($orcamento->subcategoria_id ?? 'null');
            $categorias[$key] = [
                'id' => $orcamento->id,
                'categoria_id' => $orcamento->categoria_id,
                'categoria_nome' => $orcamento->categoria?->nome,
                'categoria_cor' => $orcamento->categoria?->cor,
                'subcategoria_id' => $orcamento->subcategoria_id,
                'subcategoria_nome' => $orcamento->subcategoria?->nome,
                'planejado' => (float) $orcamento->valor_planejado,
                'realizado' => $realizado,
                'saldo' => (float) $orcamento->valor_planejado - $realizado,
                'percentual' => $orcamento->percentual_utilizado,
                'protegido' => $orcamento->protegido,
            ];
        }

        return [
            'mes' => $mes,
            'ano' => $ano,
            'total_planejado' => $totalPlanejado,
            'total_realizado' => $totalRealizado,
            'total_saldo' => $totalPlanejado - $totalRealizado,
            'percentual_geral' => $totalPlanejado > 0
                ? ($totalRealizado / $totalPlanejado) * 100
                : 0,
            'categorias' => array_values($categorias),
        ];
    }

    /**
     * Calcula o excedente de uma categoria no mês.
     */
    public function calcularExcedente(int $categoriaId, int $mes, int $ano): float
    {
        $orcamento = Orcamento::where('categoria_id', $categoriaId)
            ->whereNull('subcategoria_id')
            ->where('mes', $mes)
            ->where('ano', $ano)
            ->first();

        if (!$orcamento) {
            return 0;
        }

        $saldo = $orcamento->saldo;
        return $saldo < 0 ? abs($saldo) : 0;
    }

    /**
     * Sugere redistribuição de orçamento para cobrir excedentes.
     */
    public function sugerirRedistribuicao(int $userId, int $mes, int $ano): array
    {
        $orcamentos = Orcamento::where('user_id', $userId)
            ->where('mes', $mes)
            ->where('ano', $ano)
            ->with(['categoria', 'subcategoria'])
            ->get();

        $comExcedente = [];
        $comSaldo = [];

        foreach ($orcamentos as $orcamento) {
            $saldo = $orcamento->saldo;

            if ($saldo < 0 && !$orcamento->protegido) {
                $comExcedente[] = [
                    'orcamento' => $orcamento,
                    'excedente' => abs($saldo),
                ];
            } elseif ($saldo > 0 && !$orcamento->protegido) {
                $comSaldo[] = [
                    'orcamento' => $orcamento,
                    'disponivel' => $saldo,
                ];
            }
        }

        if (empty($comExcedente)) {
            return ['transferencias' => [], 'mensagem' => 'Nenhum excedente encontrado'];
        }

        // Ordena por maior saldo disponível
        usort($comSaldo, fn($a, $b) => $b['disponivel'] <=> $a['disponivel']);

        $transferencias = [];

        foreach ($comExcedente as $excedente) {
            $faltaRedistribuir = $excedente['excedente'];

            foreach ($comSaldo as &$saldo) {
                if ($saldo['disponivel'] <= 0 || $faltaRedistribuir <= 0) {
                    continue;
                }

                $valorTransferir = min($saldo['disponivel'], $faltaRedistribuir);

                $transferencias[] = [
                    'origem_categoria_id' => $saldo['orcamento']->categoria_id,
                    'origem_categoria_nome' => $saldo['orcamento']->categoria?->nome,
                    'origem_subcategoria_id' => $saldo['orcamento']->subcategoria_id,
                    'destino_categoria_id' => $excedente['orcamento']->categoria_id,
                    'destino_categoria_nome' => $excedente['orcamento']->categoria?->nome,
                    'destino_subcategoria_id' => $excedente['orcamento']->subcategoria_id,
                    'valor' => $valorTransferir,
                ];

                $saldo['disponivel'] -= $valorTransferir;
                $faltaRedistribuir -= $valorTransferir;
            }
        }

        return [
            'transferencias' => $transferencias,
            'total_excedente' => array_sum(array_column($comExcedente, 'excedente')),
            'total_coberto' => array_sum(array_column($transferencias, 'valor')),
        ];
    }

    /**
     * Aplica as transferências de orçamento sugeridas.
     */
    public function aplicarRedistribuicao(int $userId, array $transferencias): void
    {
        foreach ($transferencias as $t) {
            // Registra a transferência para auditoria
            TransferenciaOrcamento::create([
                'user_id' => $userId,
                'mes' => now()->month,
                'ano' => now()->year,
                'origem_categoria_id' => $t['origem_categoria_id'],
                'origem_subcategoria_id' => $t['origem_subcategoria_id'] ?? null,
                'destino_categoria_id' => $t['destino_categoria_id'],
                'destino_subcategoria_id' => $t['destino_subcategoria_id'] ?? null,
                'valor' => $t['valor'],
                'motivo' => 'Redistribuição automática de excedente',
            ]);

            // Atualiza os orçamentos
            $this->ajustarOrcamento(
                $userId,
                $t['origem_categoria_id'],
                $t['origem_subcategoria_id'] ?? null,
                -$t['valor']
            );

            $this->ajustarOrcamento(
                $userId,
                $t['destino_categoria_id'],
                $t['destino_subcategoria_id'] ?? null,
                $t['valor']
            );
        }
    }

    protected function ajustarOrcamento(
        int $userId,
        int $categoriaId,
        ?int $subcategoriaId,
        float $ajuste
    ): void {
        $orcamento = Orcamento::where('user_id', $userId)
            ->where('categoria_id', $categoriaId)
            ->where('subcategoria_id', $subcategoriaId)
            ->where('mes', now()->month)
            ->where('ano', now()->year)
            ->first();

        if ($orcamento) {
            $orcamento->valor_planejado += $ajuste;
            $orcamento->save();
        }
    }

    /**
     * Copia orçamento de um mês para outro.
     */
    public function copiarOrcamento(int $userId, int $mesOrigem, int $anoOrigem, int $mesDestino, int $anoDestino): int
    {
        $orcamentosOrigem = Orcamento::where('user_id', $userId)
            ->where('mes', $mesOrigem)
            ->where('ano', $anoOrigem)
            ->get();

        $count = 0;
        foreach ($orcamentosOrigem as $orcamento) {
            $exists = Orcamento::where('user_id', $userId)
                ->where('categoria_id', $orcamento->categoria_id)
                ->where('subcategoria_id', $orcamento->subcategoria_id)
                ->where('mes', $mesDestino)
                ->where('ano', $anoDestino)
                ->exists();

            if (!$exists) {
                Orcamento::create([
                    'user_id' => $userId,
                    'categoria_id' => $orcamento->categoria_id,
                    'subcategoria_id' => $orcamento->subcategoria_id,
                    'mes' => $mesDestino,
                    'ano' => $anoDestino,
                    'valor_planejado' => $orcamento->valor_planejado,
                    'protegido' => $orcamento->protegido,
                ]);
                $count++;
            }
        }

        return $count;
    }
}
