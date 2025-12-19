<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Orcamento extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'categoria_id',
        'subcategoria_id',
        'mes',
        'ano',
        'valor_planejado',
        'protegido',
    ];

    protected $casts = [
        'valor_planejado' => 'decimal:2',
        'protegido' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function subcategoria(): BelongsTo
    {
        return $this->belongsTo(Subcategoria::class);
    }

    public function getValorRealizadoAttribute(): float
    {
        $query = Transacao::where('user_id', $this->user_id)
            ->where('tipo', 'despesa')
            ->whereYear('data', $this->ano)
            ->whereMonth('data', $this->mes);

        if ($this->subcategoria_id) {
            $query->where('subcategoria_id', $this->subcategoria_id);
        } elseif ($this->categoria_id) {
            $query->where('categoria_id', $this->categoria_id);
        }

        return (float) $query->sum('valor');
    }

    public function getSaldoAttribute(): float
    {
        return $this->valor_planejado - $this->valor_realizado;
    }

    public function getPercentualUtilizadoAttribute(): float
    {
        if ($this->valor_planejado == 0) {
            return 0;
        }
        return ($this->valor_realizado / $this->valor_planejado) * 100;
    }

    public function scopeDoMes($query, int $mes, int $ano)
    {
        return $query->where('mes', $mes)->where('ano', $ano);
    }

    public function scopeNaoProtegidos($query)
    {
        return $query->where('protegido', false);
    }
}
