<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meta extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nome',
        'descricao',
        'icone',
        'valor_alvo',
        'valor_condicao_parcelas',
        'data_limite',
        'status',
    ];

    protected $casts = [
        'valor_alvo' => 'decimal:2',
        'valor_condicao_parcelas' => 'decimal:2',
        'data_limite' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function aportes(): HasMany
    {
        return $this->hasMany(MetaAporte::class);
    }

    public function getValorAtualAttribute(): float
    {
        return (float) $this->aportes()->sum('valor');
    }

    public function getProgressoAttribute(): float
    {
        if ($this->valor_alvo == 0) {
            return 0;
        }
        return min(100, ($this->valor_atual / $this->valor_alvo) * 100);
    }

    public function getAtingidaAttribute(): bool
    {
        // Condição 1: Valor atingido
        if ($this->valor_atual >= $this->valor_alvo) {
            return true;
        }

        // Condição 2: Parcelas alternativas
        if ($this->valor_condicao_parcelas && $this->valor_atual >= $this->valor_condicao_parcelas) {
            return true;
        }

        return false;
    }

    public function verificarEAtualizar(): void
    {
        if ($this->atingida && $this->status === 'ativa') {
            $this->status = 'atingida';
            $this->save();
        }
    }

    public function scopeAtivas($query)
    {
        return $query->where('status', 'ativa');
    }

    public function scopeAtingidas($query)
    {
        return $query->where('status', 'atingida');
    }
}
