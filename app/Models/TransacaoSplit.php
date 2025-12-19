<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransacaoSplit extends Model
{
    use HasFactory;

    protected $table = 'transacao_splits';

    protected $fillable = [
        'transacao_id',
        'categoria_id',
        'subcategoria_id',
        'valor',
        'descricao',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
    ];

    public function transacao(): BelongsTo
    {
        return $this->belongsTo(Transacao::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class);
    }
}
