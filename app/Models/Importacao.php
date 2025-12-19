<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Importacao extends Model
{
    use HasFactory;

    protected $table = 'importacoes';

    protected $fillable = [
        'user_id',
        'conta_id',
        'cartao_id',
        'nome',
        'arquivo_original',
        'arquivo_path',
        'tipo',
        'mapeamento',
        'status',
        'total_itens',
        'itens_importados',
        'itens_duplicados',
        'itens_erro',
        'log',
    ];

    protected $casts = [
        'mapeamento' => 'array',
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

    public function itens(): HasMany
    {
        return $this->hasMany(ImportacaoItem::class);
    }

    public function getProgressoAttribute(): float
    {
        if ($this->total_itens == 0) {
            return 0;
        }
        $processados = $this->itens_importados + $this->itens_duplicados + $this->itens_erro;
        return ($processados / $this->total_itens) * 100;
    }

    public function atualizarContadores(): void
    {
        $this->itens_importados = $this->itens()->where('status', 'importado')->count();
        $this->itens_duplicados = $this->itens()->where('status', 'duplicado')->count();
        $this->itens_erro = $this->itens()->where('status', 'erro')->count();
        $this->total_itens = $this->itens()->count();
        $this->save();
    }

    public function marcarConcluida(): void
    {
        $this->atualizarContadores();

        if ($this->itens_erro > 0 || $this->itens_duplicados > 0) {
            $this->status = 'com_alertas';
        } else {
            $this->status = 'concluida';
        }
        $this->save();
    }

    public function scopePendentes($query)
    {
        return $query->where('status', 'pendente');
    }

    public function scopeProcessando($query)
    {
        return $query->where('status', 'processando');
    }
}
