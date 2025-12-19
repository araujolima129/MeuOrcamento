<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cartoes', function (Blueprint $table) {
            $table->decimal('limite', 12, 2)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cartoes', function (Blueprint $table) {
            $table->decimal('limite', 12, 2)->nullable(false)->default(0)->change();
        });
    }
};
