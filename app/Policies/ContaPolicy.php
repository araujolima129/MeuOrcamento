<?php

namespace App\Policies;

use App\Models\Cartao;
use App\Models\Conta;
use App\Models\User;

class ContaPolicy
{
    public function view(User $user, Conta $conta): bool
    {
        return $user->id === $conta->user_id;
    }

    public function update(User $user, Conta $conta): bool
    {
        return $user->id === $conta->user_id;
    }

    public function delete(User $user, Conta $conta): bool
    {
        return $user->id === $conta->user_id;
    }
}
