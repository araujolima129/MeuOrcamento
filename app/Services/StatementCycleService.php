<?php

namespace App\Services;

use App\Models\Cartao;
use App\Models\CicloFatura;
use Carbon\Carbon;

class StatementCycleService
{
    /**
     * Obtém ou cria o ciclo de fatura para uma data específica.
     */
    public function getCicloParaData(Cartao $cartao, Carbon $data): CicloFatura
    {
        // Calcula o período do ciclo baseado na data de fechamento
        $diaFechamento = $cartao->dia_fechamento;
        $diaVencimento = $cartao->dia_vencimento;

        // Se a data é antes do fechamento, pertence ao ciclo anterior
        if ($data->day <= $diaFechamento) {
            $mesReferencia = $data->month;
            $anoReferencia = $data->year;
        } else {
            // Pertence ao próximo ciclo
            $proximoMes = $data->copy()->addMonth();
            $mesReferencia = $proximoMes->month;
            $anoReferencia = $proximoMes->year;
        }

        // Busca ciclo existente
        $ciclo = CicloFatura::where('cartao_id', $cartao->id)
            ->where('mes', $mesReferencia)
            ->where('ano', $anoReferencia)
            ->first();

        if ($ciclo) {
            return $ciclo;
        }

        // Cria novo ciclo
        return $this->gerarCiclo($cartao, $mesReferencia, $anoReferencia);
    }

    /**
     * Gera um novo ciclo de fatura.
     */
    public function gerarCiclo(Cartao $cartao, int $mes, int $ano): CicloFatura
    {
        $diaFechamento = $cartao->dia_fechamento;
        $diaVencimento = $cartao->dia_vencimento;

        // Calcula as datas do ciclo
        // Exemplo: Fechamento dia 27, Vencimento dia 15
        // Ciclo de Jan/2025: compras de 28/Nov a 27/Dez, vence 15/Jan

        $mesAnterior = Carbon::create($ano, $mes, 1)->subMonth();

        // Data início: dia seguinte ao fechamento do mês anterior
        $dataInicio = Carbon::create(
            $mesAnterior->year,
            $mesAnterior->month,
            min($diaFechamento + 1, $mesAnterior->daysInMonth)
        );

        // Data fim: dia do fechamento do mês atual
        $mesFechamento = Carbon::create($ano, $mes, 1)->subMonth();
        $dataFim = Carbon::create(
            $mesFechamento->year,
            $mesFechamento->month,
            min($diaFechamento, $mesFechamento->daysInMonth)
        );

        // Data vencimento: dia do vencimento no mês de referência
        $dataVencimento = Carbon::create(
            $ano,
            $mes,
            min($diaVencimento, Carbon::create($ano, $mes, 1)->daysInMonth)
        );

        return CicloFatura::create([
            'cartao_id' => $cartao->id,
            'mes' => $mes,
            'ano' => $ano,
            'data_inicio' => $dataInicio,
            'data_fim' => $dataFim,
            'data_vencimento' => $dataVencimento,
            'status' => 'aberta',
            'valor_total' => 0,
        ]);
    }

    /**
     * Recalcula o total de um ciclo.
     */
    public function recalcularTotal(CicloFatura $ciclo): void
    {
        $ciclo->recalcularTotal();
    }

    /**
     * Fecha um ciclo de fatura e cria a transação consolidada.
     */
    public function fecharCiclo(CicloFatura $ciclo): void
    {
        $ciclo->recalcularTotal();
        $ciclo->status = 'fechada';
        $ciclo->save();

        // Cria a transação consolidada (fatura) se houver valor
        if ($ciclo->valor_total > 0) {
            $this->criarFaturaConsolidada($ciclo);
        }
    }

    /**
     * Cria a transação consolidada da fatura.
     * Esta transação representa o pagamento da fatura e impacta o orçamento.
     */
    protected function criarFaturaConsolidada(CicloFatura $ciclo): \App\Models\Transacao
    {
        $cartao = $ciclo->cartao;
        $mesNome = $this->getNomeMes($ciclo->mes);

        // Verifica se já existe fatura consolidada para este ciclo
        $faturaExistente = \App\Models\Transacao::where('ciclo_fatura_id', $ciclo->id)
            ->where('forma_pagamento', 'fatura_cartao')
            ->first();

        if ($faturaExistente) {
            // Atualiza valor se já existe
            $faturaExistente->valor = $ciclo->valor_total;
            $faturaExistente->save();
            return $faturaExistente;
        }

        // Cria nova fatura consolidada
        return \App\Models\Transacao::create([
            'user_id' => $cartao->user_id,
            'cartao_id' => null, // NÃO é transação de cartão, é pagamento
            'conta_id' => null, // Usuário escolhe de onde paga depois
            'ciclo_fatura_id' => $ciclo->id,
            'data' => $ciclo->data_vencimento,
            'data_competencia' => $ciclo->data_vencimento,
            'descricao_original' => "Fatura {$cartao->nome} - {$mesNome}/{$ciclo->ano}",
            'valor' => $ciclo->valor_total,
            'tipo' => 'despesa',
            'forma_pagamento' => 'fatura_cartao',
        ]);
    }

    /**
     * Retorna o nome do mês.
     */
    protected function getNomeMes(int $mes): string
    {
        $meses = [
            1 => 'Janeiro',
            2 => 'Fevereiro',
            3 => 'Março',
            4 => 'Abril',
            5 => 'Maio',
            6 => 'Junho',
            7 => 'Julho',
            8 => 'Agosto',
            9 => 'Setembro',
            10 => 'Outubro',
            11 => 'Novembro',
            12 => 'Dezembro',
        ];
        return $meses[$mes] ?? '';
    }

    /**
     * Fecha automaticamente ciclos que já passaram da data de fechamento.
     */
    public function fecharCiclosAutomaticamente(int $userId): int
    {
        $hoje = Carbon::now();
        $ciclosFechados = 0;

        // Busca ciclos abertos onde a data de fechamento já passou
        $ciclosParaFechar = CicloFatura::whereHas('cartao', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->where('status', 'aberta')
            ->where('data_fim', '<', $hoje)
            ->get();

        foreach ($ciclosParaFechar as $ciclo) {
            $this->fecharCiclo($ciclo);
            $ciclosFechados++;
        }

        return $ciclosFechados;
    }

    /**
     * Marca um ciclo como pago.
     */
    public function pagarCiclo(CicloFatura $ciclo): void
    {
        $ciclo->status = 'paga';
        $ciclo->save();
    }

    /**
     * Lista ciclos pendentes de um cartão.
     */
    public function getCiclosPendentes(Cartao $cartao): \Illuminate\Support\Collection
    {
        return CicloFatura::where('cartao_id', $cartao->id)
            ->whereIn('status', ['aberta', 'fechada'])
            ->orderBy('ano')
            ->orderBy('mes')
            ->get();
    }

    /**
     * Gera ciclos futuros para um cartão.
     */
    public function gerarCiclosFuturos(Cartao $cartao, int $mesesAFrente = 3): void
    {
        $dataAtual = Carbon::now();

        for ($i = 0; $i <= $mesesAFrente; $i++) {
            $data = $dataAtual->copy()->addMonths($i);

            $existe = CicloFatura::where('cartao_id', $cartao->id)
                ->where('mes', $data->month)
                ->where('ano', $data->year)
                ->exists();

            if (!$existe) {
                $this->gerarCiclo($cartao, $data->month, $data->year);
            }
        }
    }

    /**
     * Atribuir transação ao ciclo correto.
     */
    public function atribuirTransacaoAoCiclo(
        Cartao $cartao,
        \App\Models\Transacao $transacao
    ): CicloFatura {
        $ciclo = $this->getCicloParaData($cartao, Carbon::parse($transacao->data));

        $transacao->ciclo_fatura_id = $ciclo->id;
        $transacao->save();

        $ciclo->recalcularTotal();

        return $ciclo;
    }
}
