<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'action',
        'old_values',
        'new_values',
        'ip',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function registrar(
        int $userId,
        string $modelType,
        int $modelId,
        string $action,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ip = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip' => $ip ?? request()->ip(),
        ]);
    }

    public function scopePorModel($query, string $modelType, int $modelId)
    {
        return $query->where('model_type', $modelType)->where('model_id', $modelId);
    }

    public function scopeRecentes($query, int $limite = 50)
    {
        return $query->orderBy('created_at', 'desc')->limit($limite);
    }
}
