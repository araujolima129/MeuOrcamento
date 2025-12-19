<?php

namespace App\Services\Parsers;

class ParcelaParser
{
    /**
     * Padrões de parcela suportados.
     * Ordem importa: padrões mais específicos primeiro.
     */
    protected array $patterns = [
        // PARC 02/12, *PARC 02/12, PARC02/12
        '/\*?PARC\.?\s*(\d{1,2})\/(\d{1,2})/i',
        // Parcela 2 de 12, parcela 02 de 12
        '/parcela\s+(\d{1,2})\s+de\s+(\d{1,2})/i',
        // 02/12 no final da string (comum em extratos)
        '/\s(\d{1,2})\/(\d{1,2})$/i',
        // 02/12 precedido de espaço ou texto
        '/\s(\d{1,2})\/(\d{1,2})\s/i',
    ];

    /**
     * Analisa a descrição e extrai informações de parcelamento.
     *
     * @param string $descricao
     * @return array|null Retorna null se não for parcelada, ou array com info
     */
    public function parse(string $descricao): ?array
    {
        foreach ($this->patterns as $pattern) {
            if (preg_match($pattern, $descricao, $matches)) {
                $parcelaAtual = (int) $matches[1];
                $parcelaTotal = (int) $matches[2];

                // Validação básica: parcela atual <= total e total > 1
                if ($parcelaAtual > 0 && $parcelaTotal > 1 && $parcelaAtual <= $parcelaTotal) {
                    return [
                        'parcela_atual' => $parcelaAtual,
                        'parcela_total' => $parcelaTotal,
                        'descricao_limpa' => $this->limparDescricao($descricao, $matches[0]),
                    ];
                }
            }
        }

        return null;
    }

    /**
     * Remove o padrão de parcela da descrição.
     */
    protected function limparDescricao(string $descricao, string $padrao): string
    {
        $limpa = str_replace($padrao, '', $descricao);
        // Remove espaços extras
        $limpa = preg_replace('/\s+/', ' ', $limpa);
        return trim($limpa);
    }

    /**
     * Verifica se a descrição indica uma transação parcelada.
     */
    public function isParcelada(string $descricao): bool
    {
        return $this->parse($descricao) !== null;
    }

    /**
     * Calcula a data original da compra baseado na parcela atual.
     * Se é parcela 2 e a data é Novembro, a compra foi em Outubro.
     *
     * @param \DateTimeInterface $dataCobranca Data da cobrança da parcela
     * @param int $parcelaAtual Número da parcela atual
     * @return \DateTimeInterface Data estimada da compra original
     */
    public function calcularDataOriginal(\DateTimeInterface $dataCobranca, int $parcelaAtual): \DateTimeInterface
    {
        $data = \Carbon\Carbon::parse($dataCobranca);
        // Se é parcela 2, subtrai 1 mês; se é parcela 3, subtrai 2 meses, etc.
        return $data->subMonths($parcelaAtual - 1);
    }
}
