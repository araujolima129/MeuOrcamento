<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cartao extends Model
{
    use HasFactory;

    protected $table = 'cartoes';

    protected $fillable = [
        'user_id',
        'nome',
        'bandeira',
        'final',
        'limite',
        'dia_fechamento',
        'dia_vencimento',
        'cor',
        'ativo',
    ];

    protected $casts = [
        'limite' => 'decimal:2',
        'ativo' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ciclos(): HasMany
    {
        return $this->hasMany(CicloFatura::class);
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class);
    }

    public function getLimiteDisponivelAttribute(): float
    {
        $faturaAberta = $this->ciclos()
            ->where('status', 'aberta')
            ->sum('valor_total');

        return $this->limite - $faturaAberta;
    }

    public function scopeAtivos($query)
    {
        return $query->where('ativo', true);
    }
}
