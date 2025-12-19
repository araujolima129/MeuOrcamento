<?php

namespace App\Console\Commands;

use App\Models\Transacao;
use App\Services\DedupeService;
use Illuminate\Console\Command;

class RecalculateHashes extends Command
{
    protected $signature = 'dedupe:recalculate {--user= : ID do usuário (opcional, todos se não informado)}';
    protected $description = 'Recalcula os hashes de deduplicação de todas as transações';

    public function handle(DedupeService $dedupeService): int
    {
        $userId = $this->option('user');

        $query = Transacao::query();
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $total = $query->count();
        $this->info("Recalculando hashes de {$total} transações...");

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunk(100, function ($transacoes) use ($dedupeService, $bar) {
            foreach ($transacoes as $transacao) {
                $dedupeService->updateHash($transacao);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Hashes recalculados com sucesso!');

        return Command::SUCCESS;
    }
}
