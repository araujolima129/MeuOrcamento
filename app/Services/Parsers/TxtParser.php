<?php

namespace App\Services\Parsers;

use Carbon\Carbon;
use Exception;

class TxtParser implements ParserInterface
{
    public function parse(string $content, ?array $mapping = null): array
    {
        if (!$mapping) {
            throw new Exception('Mapeamento de posições é obrigatório para TXT');
        }

        $transactions = [];
        $lines = explode("\n", $content);

        $startLine = $mapping['skip_header'] ?? false ? 1 : 0;

        for ($i = $startLine; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) {
                continue;
            }

            try {
                $transaction = $this->mapTransaction($line, $mapping);
                if ($transaction) {
                    $transactions[] = $transaction;
                }
            } catch (Exception $e) {
                continue;
            }
        }

        return $transactions;
    }

    private function mapTransaction(string $line, array $mapping): ?array
    {
        $data = [];

        // Modo de extração: posicional ou regex
        $mode = $mapping['mode'] ?? 'positional';

        if ($mode === 'regex') {
            return $this->extractWithRegex($line, $mapping);
        }

        // Modo posicional (colunas fixas)

        // Data
        if (isset($mapping['data_start']) && isset($mapping['data_length'])) {
            $dataStr = substr($line, $mapping['data_start'], $mapping['data_length']);
            $data['data'] = $this->parseDate(trim($dataStr), $mapping['date_format'] ?? 'd/m/Y');
        } else {
            return null;
        }

        // Descrição
        if (isset($mapping['descricao_start']) && isset($mapping['descricao_length'])) {
            $data['descricao'] = trim(substr($line, $mapping['descricao_start'], $mapping['descricao_length']));
        } else {
            $data['descricao'] = 'Sem descrição';
        }

        // Valor
        if (isset($mapping['valor_start']) && isset($mapping['valor_length'])) {
            $valorStr = substr($line, $mapping['valor_start'], $mapping['valor_length']);
            $data['valor'] = $this->parseValue(trim($valorStr));
        } else {
            return null;
        }

        // Tipo
        if (isset($mapping['tipo_start']) && isset($mapping['tipo_length'])) {
            $tipoStr = trim(substr($line, $mapping['tipo_start'], $mapping['tipo_length']));
            $data['tipo'] = strtoupper($tipoStr) === 'C' ? 'receita' : 'despesa';
        } else {
            $data['tipo'] = $data['valor'] >= 0 ? 'receita' : 'despesa';
            $data['valor'] = abs($data['valor']);
        }

        // Identificador
        if (isset($mapping['identificador_start']) && isset($mapping['identificador_length'])) {
            $data['identificador'] = trim(substr($line, $mapping['identificador_start'], $mapping['identificador_length']));
        } else {
            $data['identificador'] = null;
        }

        return $data;
    }

    private function extractWithRegex(string $line, array $mapping): ?array
    {
        $pattern = $mapping['pattern'] ?? null;
        if (!$pattern) {
            return null;
        }

        if (!preg_match($pattern, $line, $matches)) {
            return null;
        }

        $data = [];

        // Data
        if (isset($mapping['data_group']) && isset($matches[$mapping['data_group']])) {
            $data['data'] = $this->parseDate($matches[$mapping['data_group']], $mapping['date_format'] ?? 'd/m/Y');
        } else {
            return null;
        }

        // Descrição
        if (isset($mapping['descricao_group']) && isset($matches[$mapping['descricao_group']])) {
            $data['descricao'] = trim($matches[$mapping['descricao_group']]);
        } else {
            $data['descricao'] = 'Sem descrição';
        }

        // Valor
        if (isset($mapping['valor_group']) && isset($matches[$mapping['valor_group']])) {
            $data['valor'] = $this->parseValue($matches[$mapping['valor_group']]);
        } else {
            return null;
        }

        // Tipo
        if (isset($mapping['tipo_group']) && isset($matches[$mapping['tipo_group']])) {
            $tipoStr = strtoupper(trim($matches[$mapping['tipo_group']]));
            $data['tipo'] = $tipoStr === 'C' ? 'receita' : 'despesa';
        } else {
            $data['tipo'] = $data['valor'] >= 0 ? 'receita' : 'despesa';
            $data['valor'] = abs($data['valor']);
        }

        $data['identificador'] = null;

        return $data;
    }

    private function parseDate(string $dateStr, string $format): string
    {
        try {
            return Carbon::createFromFormat($format, $dateStr)->format('Y-m-d');
        } catch (Exception $e) {
            return Carbon::now()->format('Y-m-d');
        }
    }

    private function parseValue(string $valueStr): float
    {
        $valueStr = preg_replace('/[R$\s]/', '', $valueStr);

        if (preg_match('/\d{1,3}\.\d{3},\d{2}$/', $valueStr)) {
            $valueStr = str_replace('.', '', $valueStr);
            $valueStr = str_replace(',', '.', $valueStr);
        } else {
            $valueStr = str_replace(',', '.', $valueStr);
        }

        return (float) $valueStr;
    }

    public function supports(string $content): bool
    {
        // TXT é o fallback quando não é OFX nem CSV estruturado
        $lines = explode("\n", $content);

        // Verifica se há linhas com largura consistente (posicional)
        $lengths = [];
        foreach (array_slice($lines, 0, 10) as $line) {
            if (!empty(trim($line))) {
                $lengths[] = strlen($line);
            }
        }

        if (count($lengths) >= 3) {
            $variance = $this->calculateVariance($lengths);
            return $variance < 5; // Linhas com largura similar
        }

        return false;
    }

    private function calculateVariance(array $numbers): float
    {
        $count = count($numbers);
        $mean = array_sum($numbers) / $count;
        $sumSquares = 0;

        foreach ($numbers as $n) {
            $sumSquares += pow($n - $mean, 2);
        }

        return sqrt($sumSquares / $count);
    }

    public function getType(): string
    {
        return 'txt';
    }
}
