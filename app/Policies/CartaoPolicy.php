<?php

namespace App\Policies;

use App\Models\Cartao;
use App\Models\User;

class CartaoPolicy
{
    public function view(User $user, Cartao $cartao): bool
    {
        return $user->id === $cartao->user_id;
    }

    public function update(User $user, Cartao $cartao): bool
    {
        return $user->id === $cartao->user_id;
    }

    public function delete(User $user, Cartao $cartao): bool
    {
        return $user->id === $cartao->user_id;
    }
}
