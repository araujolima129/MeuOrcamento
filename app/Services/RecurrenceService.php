<?php

namespace App\Services;

use App\Models\Transacao;
use Carbon\Carbon;

class RecurrenceService
{
    /**
     * Gera transações recorrentes para os próximos meses.
     */
    public function gerarRecorrencias(Transacao $transacaoBase, int $mesesAFrente = 12): array
    {
        if (!$transacaoBase->fixa) {
            return [];
        }

        $transacoesGeradas = [];
        $dataBase = Carbon::parse($transacaoBase->data);

        for ($i = 1; $i <= $mesesAFrente; $i++) {
            $novaData = $dataBase->copy()->addMonths($i);

            // Verifica se já existe transação para este mês
            $existe = Transacao::where('user_id', $transacaoBase->user_id)
                ->where('transacao_pai_id', $transacaoBase->id)
                ->whereYear('data', $novaData->year)
                ->whereMonth('data', $novaData->month)
                ->exists();

            if ($existe) {
                continue;
            }

            $novaTransacao = Transacao::create([
                'user_id' => $transacaoBase->user_id,
                'conta_id' => $transacaoBase->conta_id,
                'cartao_id' => $transacaoBase->cartao_id,
                'categoria_id' => $transacaoBase->categoria_id,
                'subcategoria_id' => $transacaoBase->subcategoria_id,
                'responsavel_id' => $transacaoBase->responsavel_id,
                'data' => $novaData,
                'data_competencia' => $novaData,
                'descricao_original' => $transacaoBase->descricao_original,
                'descricao' => $transacaoBase->descricao,
                'valor' => $transacaoBase->valor,
                'tipo' => $transacaoBase->tipo,
                'forma_pagamento' => $transacaoBase->forma_pagamento,
                'fixa' => true,
                'parcelada' => false,
                'transacao_pai_id' => $transacaoBase->id,
                'observacoes' => $transacaoBase->observacoes,
            ]);

            $transacoesGeradas[] = $novaTransacao;
        }

        return $transacoesGeradas;
    }

    /**
     * Prorroga todas as despesas fixas ativas.
     */
    public function prorrogarDespesasFixas(int $userId, int $mesesMinimos = 3): int
    {
        $count = 0;

        // Pega todas as transações fixas que são "pai" (não têm transacao_pai_id)
        $transacoesFixas = Transacao::where('user_id', $userId)
            ->where('fixa', true)
            ->whereNull('transacao_pai_id')
            ->where('tipo', 'despesa')
            ->get();

        foreach ($transacoesFixas as $transacao) {
            // Verifica a última recorrência gerada
            $ultimaRecorrencia = Transacao::where('transacao_pai_id', $transacao->id)
                ->orderBy('data', 'desc')
                ->first();

            $ultimaData = $ultimaRecorrencia
                ? Carbon::parse($ultimaRecorrencia->data)
                : Carbon::parse($transacao->data);

            $mesesRestantes = $ultimaData->diffInMonths(Carbon::now());

            // Se restam menos que o mínimo, prorroga
            if ($mesesRestantes < $mesesMinimos) {
                $mesesAGerar = $mesesMinimos - $mesesRestantes + 1;
                $geradas = $this->gerarRecorrencias($transacao, $mesesAGerar);
                $count += count($geradas);
            }
        }

        return $count;
    }

    /**
     * Gera parcelas para uma transação parcelada.
     */
    public function gerarParcelas(Transacao $transacaoBase, int $totalParcelas): array
    {
        if ($totalParcelas <= 1) {
            return [];
        }

        $valorParcela = round($transacaoBase->valor / $totalParcelas, 2);
        $valorUltimaParcela = $transacaoBase->valor - ($valorParcela * ($totalParcelas - 1));

        $parcelas = [];
        $dataBase = Carbon::parse($transacaoBase->data);

        // Atualiza a transação base como a primeira parcela
        $transacaoBase->parcelada = true;
        $transacaoBase->parcela_atual = 1;
        $transacaoBase->parcela_total = $totalParcelas;
        $transacaoBase->valor = $valorParcela;
        $transacaoBase->save();

        // Cria as demais parcelas
        for ($i = 2; $i <= $totalParcelas; $i++) {
            $novaData = $dataBase->copy()->addMonths($i - 1);
            $valor = $i === $totalParcelas ? $valorUltimaParcela : $valorParcela;

            $parcela = Transacao::create([
                'user_id' => $transacaoBase->user_id,
                'conta_id' => $transacaoBase->conta_id,
                'cartao_id' => $transacaoBase->cartao_id,
                'ciclo_fatura_id' => null, // Será calculado pelo StatementCycleService
                'categoria_id' => $transacaoBase->categoria_id,
                'subcategoria_id' => $transacaoBase->subcategoria_id,
                'responsavel_id' => $transacaoBase->responsavel_id,
                'data' => $novaData,
                'data_competencia' => $novaData,
                'descricao_original' => $transacaoBase->descricao_original,
                'descricao' => $transacaoBase->descricao,
                'valor' => $valor,
                'tipo' => $transacaoBase->tipo,
                'forma_pagamento' => $transacaoBase->forma_pagamento,
                'fixa' => false,
                'parcelada' => true,
                'parcela_atual' => $i,
                'parcela_total' => $totalParcelas,
                'transacao_pai_id' => $transacaoBase->id,
                'observacoes' => $transacaoBase->observacoes,
            ]);

            $parcelas[] = $parcela;
        }

        return $parcelas;
    }

    /**
     * Remove todas as recorrências futuras de uma transação fixa.
     */
    public function cancelarRecorrenciasFuturas(Transacao $transacaoBase): int
    {
        $count = Transacao::where('transacao_pai_id', $transacaoBase->id)
            ->where('data', '>', Carbon::now())
            ->forceDelete();

        $transacaoBase->fixa = false;
        $transacaoBase->save();

        return $count;
    }
}
