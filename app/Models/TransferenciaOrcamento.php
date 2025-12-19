<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferenciaOrcamento extends Model
{
    use HasFactory;

    protected $table = 'transferencias_orcamento';

    protected $fillable = [
        'user_id',
        'mes',
        'ano',
        'origem_categoria_id',
        'origem_subcategoria_id',
        'destino_categoria_id',
        'destino_subcategoria_id',
        'valor',
        'motivo',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function origemCategoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'origem_categoria_id');
    }

    public function origemSubcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class, 'origem_subcategoria_id');
    }

    public function destinoCategoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'destino_categoria_id');
    }

    public function destinoSubcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class, 'destino_subcategoria_id');
    }
}
