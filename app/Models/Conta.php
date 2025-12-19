<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conta extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nome',
        'banco',
        'agencia',
        'numero',
        'saldo_inicial',
        'cor',
        'ativo',
    ];

    protected $casts = [
        'saldo_inicial' => 'decimal:2',
        'ativo' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class);
    }

    public function getSaldoAtualAttribute(): float
    {
        $receitas = $this->transacoes()->where('tipo', 'receita')->sum('valor');
        $despesas = $this->transacoes()->where('tipo', 'despesa')->sum('valor');

        return $this->saldo_inicial + $receitas - $despesas;
    }

    public function scopeAtivas($query)
    {
        return $query->where('ativo', true);
    }
}
