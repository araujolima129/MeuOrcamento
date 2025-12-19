<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetaAporte extends Model
{
    use HasFactory;

    protected $fillable = [
        'meta_id',
        'data',
        'valor',
        'observacao',
    ];

    protected $casts = [
        'data' => 'date',
        'valor' => 'decimal:2',
    ];

    public function meta(): BelongsTo
    {
        return $this->belongsTo(Meta::class);
    }

    protected static function booted(): void
    {
        static::saved(function (MetaAporte $aporte) {
            $aporte->meta->verificarEAtualizar();
        });

        static::deleted(function (MetaAporte $aporte) {
            $aporte->meta->verificarEAtualizar();
        });
    }
}
