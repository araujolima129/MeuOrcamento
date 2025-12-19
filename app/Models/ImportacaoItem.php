<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportacaoItem extends Model
{
    use HasFactory;

    protected $table = 'importacao_itens';

    protected $fillable = [
        'importacao_id',
        'transacao_id',
        'dados_originais',
        'hash_dedupe',
        'status',
        'erro',
    ];

    protected $casts = [
        'dados_originais' => 'array',
    ];

    public function importacao(): BelongsTo
    {
        return $this->belongsTo(Importacao::class);
    }

    public function transacao(): BelongsTo
    {
        return $this->belongsTo(Transacao::class);
    }

    public function marcarImportado(Transacao $transacao): void
    {
        $this->transacao_id = $transacao->id;
        $this->status = 'importado';
        $this->save();
    }

    public function marcarDuplicado(): void
    {
        $this->status = 'duplicado';
        $this->save();
    }

    public function marcarErro(string $erro): void
    {
        $this->status = 'erro';
        $this->erro = $erro;
        $this->save();
    }

    public function marcarIgnorado(): void
    {
        $this->status = 'ignorado';
        $this->save();
    }
}
