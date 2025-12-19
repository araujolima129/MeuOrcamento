<?php

namespace App\Services\Parsers;

interface ParserInterface
{
    /**
     * Parseia o conteúdo do arquivo e retorna um array de transações.
     *
     * @param string $content Conteúdo do arquivo
     * @param array|null $mapping Mapeamento de colunas (para CSV/TXT)
     * @return array<int, array{
     *   data: string,
     *   descricao: string,
     *   valor: float,
     *   tipo: string,
     *   identificador: string|null
     * }>
     */
    public function parse(string $content, ?array $mapping = null): array;

    /**
     * Detecta se o conteúdo é do tipo suportado por este parser.
     *
     * @param string $content
     * @return bool
     */
    public function supports(string $content): bool;

    /**
     * Retorna o tipo do parser.
     *
     * @return string (ofx, csv, txt)
     */
    public function getType(): string;
}
