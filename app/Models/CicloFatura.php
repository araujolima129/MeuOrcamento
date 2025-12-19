<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CicloFatura extends Model
{
    use HasFactory;

    protected $table = 'ciclos_fatura';

    protected $fillable = [
        'cartao_id',
        'mes',
        'ano',
        'data_inicio',
        'data_fim',
        'data_vencimento',
        'status',
        'valor_total',
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
        'data_vencimento' => 'date',
        'valor_total' => 'decimal:2',
    ];

    public function cartao(): BelongsTo
    {
        return $this->belongsTo(Cartao::class);
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class);
    }

    public function recalcularTotal(): void
    {
        $this->valor_total = $this->transacoes()->sum('valor');
        $this->save();
    }

    public function scopeAbertos($query)
    {
        return $query->where('status', 'aberta');
    }

    public function scopeFechados($query)
    {
        return $query->where('status', 'fechada');
    }

    public function scopePagos($query)
    {
        return $query->where('status', 'paga');
    }
}
