<?php

namespace App\Services\Parsers;

use Carbon\Carbon;
use Exception;

class CsvParser implements ParserInterface
{
    public function parse(string $content, ?array $mapping = null): array
    {
        if (!$mapping) {
            throw new Exception('Mapeamento de colunas é obrigatório para CSV');
        }

        $transactions = [];
        $lines = $this->parseLines($content);

        // Pula o cabeçalho se configurado
        $startLine = $mapping['skip_header'] ?? true ? 1 : 0;

        for ($i = $startLine; $i < count($lines); $i++) {
            $line = $lines[$i];
            if (empty(array_filter($line))) {
                continue; // Pula linhas vazias
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

    private function parseLines(string $content): array
    {
        $lines = [];

        // Remove BOM
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        // Detecta delimitador
        $delimiter = $this->detectDelimiter($content);

        // Parse CSV
        $rows = str_getcsv($content, "\n");
        foreach ($rows as $row) {
            $lines[] = str_getcsv($row, $delimiter);
        }

        return $lines;
    }

    private function detectDelimiter(string $content): string
    {
        $firstLine = strtok($content, "\n");

        $delimiters = [';', ',', "\t", '|'];
        $counts = [];

        foreach ($delimiters as $delimiter) {
            $counts[$delimiter] = substr_count($firstLine, $delimiter);
        }

        arsort($counts);
        return array_key_first($counts) ?: ',';
    }

    private function mapTransaction(array $line, array $mapping): ?array
    {
        $data = [];

        // Data
        $dataCol = $mapping['data'] ?? null;
        if ($dataCol !== null && isset($line[$dataCol])) {
            $data['data'] = $this->parseDate($line[$dataCol], $mapping['date_format'] ?? 'd/m/Y');
        } else {
            return null;
        }

        // Descrição
        $descCol = $mapping['descricao'] ?? null;
        if ($descCol !== null && isset($line[$descCol])) {
            $data['descricao'] = trim($line[$descCol]);
        } else {
            $data['descricao'] = 'Sem descrição';
        }

        // Valor
        $valorCol = $mapping['valor'] ?? null;
        if ($valorCol !== null && isset($line[$valorCol])) {
            $data['valor'] = $this->parseValue($line[$valorCol]);
        } else {
            return null;
        }

        // Tipo (crédito/débito)
        $tipoCol = $mapping['tipo'] ?? null;
        if ($tipoCol !== null && isset($line[$tipoCol])) {
            $tipoValue = strtolower(trim($line[$tipoCol]));
            $data['tipo'] = in_array($tipoValue, ['c', 'credito', 'crédito', 'credit', '+'])
                ? 'receita'
                : 'despesa';
        } else {
            // Determina pelo sinal do valor
            $data['tipo'] = $data['valor'] >= 0 ? 'receita' : 'despesa';
            $data['valor'] = abs($data['valor']);
        }

        // Identificador (opcional)
        $idCol = $mapping['identificador'] ?? null;
        if ($idCol !== null && isset($line[$idCol])) {
            $data['identificador'] = trim($line[$idCol]);
        } else {
            $data['identificador'] = null;
        }

        return $data;
    }

    private function parseDate(string $dateStr, string $format): string
    {
        $dateStr = trim($dateStr);

        try {
            return Carbon::createFromFormat($format, $dateStr)->format('Y-m-d');
        } catch (Exception $e) {
            // Tenta formatos comuns
            $formats = ['d/m/Y', 'd-m-Y', 'Y-m-d', 'd/m/y', 'Y/m/d'];
            foreach ($formats as $fmt) {
                try {
                    return Carbon::createFromFormat($fmt, $dateStr)->format('Y-m-d');
                } catch (Exception $e) {
                    continue;
                }
            }
        }

        return Carbon::now()->format('Y-m-d');
    }

    private function parseValue(string $valueStr): float
    {
        $valueStr = trim($valueStr);

        // Remove espaços e símbolos de moeda
        $valueStr = preg_replace('/[R$\s]/', '', $valueStr);

        // Detecta formato brasileiro (1.234,56) ou americano (1,234.56)
        if (preg_match('/\d{1,3}\.\d{3},\d{2}$/', $valueStr)) {
            // Formato brasileiro
            $valueStr = str_replace('.', '', $valueStr);
            $valueStr = str_replace(',', '.', $valueStr);
        } elseif (preg_match('/\d{1,3},\d{3}\.\d{2}$/', $valueStr)) {
            // Formato americano
            $valueStr = str_replace(',', '', $valueStr);
        } else {
            // Formato simples com vírgula
            $valueStr = str_replace(',', '.', $valueStr);
        }

        return (float) $valueStr;
    }

    public function supports(string $content): bool
    {
        // CSV deve ter delimitadores consistentes
        $lines = explode("\n", $content, 3);
        if (count($lines) < 2) {
            return false;
        }

        $delimiter = $this->detectDelimiter($content);
        $count1 = substr_count($lines[0], $delimiter);
        $count2 = substr_count($lines[1], $delimiter);

        return $count1 > 0 && $count1 === $count2;
    }

    public function getType(): string
    {
        return 'csv';
    }

    /**
     * Analisa o cabeçalho do CSV e sugere mapeamento.
     */
    public function suggestMapping(string $content): array
    {
        $lines = $this->parseLines($content);
        if (empty($lines)) {
            return [];
        }

        $header = $lines[0];
        $mapping = [
            'skip_header' => true,
            'date_format' => 'd/m/Y',
        ];

        $patterns = [
            'data' => ['data', 'date', 'dt', 'data da compra', 'data transação'],
            'descricao' => ['descricao', 'descrição', 'description', 'memo', 'historico', 'histórico', 'estabelecimento'],
            'valor' => ['valor', 'value', 'amount', 'vl', 'quantia'],
            'tipo' => ['tipo', 'type', 'natureza', 'dc', 'd/c'],
            'identificador' => ['id', 'identificador', 'codigo', 'código', 'nsu', 'doc'],
        ];

        foreach ($header as $index => $colName) {
            $colName = strtolower(trim($colName));
            foreach ($patterns as $field => $keywords) {
                foreach ($keywords as $keyword) {
                    if (strpos($colName, $keyword) !== false) {
                        $mapping[$field] = $index;
                        break 2;
                    }
                }
            }
        }

        return $mapping;
    }
}
