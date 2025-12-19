<?php

namespace App\Services\Parsers;

use Carbon\Carbon;
use Exception;

class OfxParser implements ParserInterface
{
    public function parse(string $content, ?array $mapping = null): array
    {
        $transactions = [];

        // Remove BOM se existir
        $content = $this->removeBom($content);

        // Extrai todas as transações do OFX
        preg_match_all('/<STMTTRN>(.*?)<\/STMTTRN>/s', $content, $matches);

        if (empty($matches[1])) {
            // Tenta formato sem tags de fechamento (OFX 1.x SGML)
            preg_match_all('/<STMTTRN>(.*?)(?=<STMTTRN>|<\/BANKTRANLIST|$)/s', $content, $matches);
        }

        foreach ($matches[1] as $transactionBlock) {
            try {
                $transaction = $this->parseTransaction($transactionBlock);
                if ($transaction) {
                    $transactions[] = $transaction;
                }
            } catch (Exception $e) {
                // Log error and continue
                continue;
            }
        }

        return $transactions;
    }

    private function parseTransaction(string $block): ?array
    {
        $data = [];

        // TRNTYPE (tipo da transação)
        if (preg_match('/<TRNTYPE>([^<\r\n]+)/i', $block, $m)) {
            $tipo = strtoupper(trim($m[1]));
            $data['tipo'] = in_array($tipo, ['CREDIT', 'DEP', 'INT', 'DIV']) ? 'receita' : 'despesa';
        } else {
            return null;
        }

        // DTPOSTED (data)
        if (preg_match('/<DTPOSTED>([^<\r\n]+)/i', $block, $m)) {
            $dateStr = trim($m[1]);
            // Formato: YYYYMMDDHHMMSS ou YYYYMMDD
            $data['data'] = $this->parseOfxDate($dateStr);
        } else {
            return null;
        }

        // TRNAMT (valor)
        if (preg_match('/<TRNAMT>([^<\r\n]+)/i', $block, $m)) {
            $valorStr = str_replace(',', '.', trim($m[1]));
            $valor = (float) $valorStr;

            // Mantém o sinal original para exibição
            $data['valor'] = abs($valor);

            // Determina o tipo baseado no sinal do valor E no TRNTYPE
            // Valor positivo = crédito/entrada (receita)
            // Valor negativo = débito/saída (despesa)
            if ($valor > 0) {
                $data['tipo'] = 'receita';
            } else {
                $data['tipo'] = 'despesa';
            }
        } else {
            return null;
        }

        // FITID (identificador único)
        if (preg_match('/<FITID>([^<\r\n]+)/i', $block, $m)) {
            $data['identificador'] = trim($m[1]);
        } else {
            $data['identificador'] = null;
        }

        // NAME ou MEMO (descrição)
        $descricao = '';
        if (preg_match('/<NAME>([^<\r\n]+)/i', $block, $m)) {
            $descricao = trim($m[1]);
        }
        if (preg_match('/<MEMO>([^<\r\n]+)/i', $block, $m)) {
            $memo = trim($m[1]);
            $descricao = $descricao ? "$descricao - $memo" : $memo;
        }
        $data['descricao'] = $this->cleanDescription($descricao) ?: 'Sem descrição';

        return $data;
    }

    private function parseOfxDate(string $dateStr): string
    {
        // Remove timezone se existir
        $dateStr = preg_replace('/\[.*\]/', '', $dateStr);
        $dateStr = substr($dateStr, 0, 8); // YYYYMMDD

        try {
            return Carbon::createFromFormat('Ymd', $dateStr)->format('Y-m-d');
        } catch (Exception $e) {
            return Carbon::now()->format('Y-m-d');
        }
    }

    private function cleanDescription(string $desc): string
    {
        // Remove caracteres especiais e espaços duplicados
        $desc = preg_replace('/\s+/', ' ', $desc);
        return trim($desc);
    }

    private function removeBom(string $content): string
    {
        $bom = pack('H*', 'EFBBBF');
        return preg_replace("/^$bom/", '', $content);
    }

    public function supports(string $content): bool
    {
        // Verifica se contém headers OFX
        return preg_match('/<OFX>|OFXHEADER/i', $content) === 1;
    }

    public function getType(): string
    {
        return 'ofx';
    }
}
