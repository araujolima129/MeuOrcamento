<?php

namespace App\Policies;

use App\Models\Meta;
use App\Models\User;

class MetaPolicy
{
    public function view(User $user, Meta $meta): bool
    {
        return $user->id === $meta->user_id;
    }

    public function update(User $user, Meta $meta): bool
    {
        return $user->id === $meta->user_id;
    }

    public function delete(User $user, Meta $meta): bool
    {
        return $user->id === $meta->user_id;
    }
}
