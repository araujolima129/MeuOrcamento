<?php

namespace App\Policies;

use App\Models\Transacao;
use App\Models\User;

class TransacaoPolicy
{
    public function view(User $user, Transacao $transacao): bool
    {
        return $user->id === $transacao->user_id;
    }

    public function update(User $user, Transacao $transacao): bool
    {
        return $user->id === $transacao->user_id;
    }

    public function delete(User $user, Transacao $transacao): bool
    {
        return $user->id === $transacao->user_id;
    }
}
