<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transacao extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'transacoes';

    protected $fillable = [
        'user_id',
        'conta_id',
        'cartao_id',
        'ciclo_fatura_id',
        'categoria_id',
        'subcategoria_id',
        'responsavel_id',
        'data',
        'data_competencia',
        'descricao_original',
        'descricao',
        'valor',
        'tipo',
        'forma_pagamento',
        'fixa',
        'parcelada',
        'parcela_atual',
        'parcela_total',
        'transacao_pai_id',
        'identificador_externo',
        'hash_dedupe',
        'observacoes',
    ];

    protected $casts = [
        'data' => 'date',
        'data_competencia' => 'date',
        'valor' => 'decimal:2',
        'fixa' => 'boolean',
        'parcelada' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conta(): BelongsTo
    {
        return $this->belongsTo(Conta::class);
    }

    public function cartao(): BelongsTo
    {
        return $this->belongsTo(Cartao::class);
    }

    public function cicloFatura(): BelongsTo
    {
        return $this->belongsTo(CicloFatura::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class);
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(Responsavel::class);
    }

    public function transacaoPai(): BelongsTo
    {
        return $this->belongsTo(Transacao::class, 'transacao_pai_id');
    }

    public function parcelas(): HasMany
    {
        return $this->hasMany(Transacao::class, 'transacao_pai_id');
    }

    public function splits(): HasMany
    {
        return $this->hasMany(TransacaoSplit::class);
    }

    public function hasSplits(): bool
    {
        return $this->splits()->exists();
    }

    public function getDescricaoExibicaoAttribute(): string
    {
        return $this->descricao ?? $this->descricao_original;
    }

    // Scopes
    public function scopeReceitas($query)
    {
        return $query->where('tipo', 'receita');
    }

    public function scopeDespesas($query)
    {
        return $query->where('tipo', 'despesa');
    }

    public function scopeFixas($query)
    {
        return $query->where('fixa', true);
    }

    public function scopeVariaveis($query)
    {
        return $query->where('fixa', false);
    }

    public function scopeDoMes($query, int $mes, int $ano)
    {
        return $query->whereYear('data', $ano)->whereMonth('data', $mes);
    }

    public function scopePorCategoria($query, int $categoriaId)
    {
        return $query->where('categoria_id', $categoriaId);
    }
}
