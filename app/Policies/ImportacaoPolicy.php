<?php

namespace App\Policies;

use App\Models\Importacao;
use App\Models\User;

class ImportacaoPolicy
{
    public function view(User $user, Importacao $importacao): bool
    {
        return $user->id === $importacao->user_id;
    }

    public function update(User $user, Importacao $importacao): bool
    {
        return $user->id === $importacao->user_id;
    }

    public function delete(User $user, Importacao $importacao): bool
    {
        return $user->id === $importacao->user_id;
    }
}
