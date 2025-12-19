<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Responsáveis (pessoas por transação)
        Schema::create('responsaveis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->string('cor', 7)->default('#6366f1');
            $table->string('avatar')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'nome']);
        });

        // Categorias
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->string('icone')->nullable();
            $table->string('cor', 7)->default('#10b981');
            $table->enum('tipo', ['receita', 'despesa'])->default('despesa');
            $table->boolean('ativo')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'nome', 'tipo']);
            $table->index(['user_id', 'tipo']);
        });

        // Subcategorias
        Schema::create('subcategorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->string('icone')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
            $table->unique(['categoria_id', 'nome']);
        });

        // Contas
        Schema::create('contas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->string('banco')->nullable();
            $table->string('agencia')->nullable();
            $table->string('numero')->nullable();
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->string('cor', 7)->default('#3b82f6');
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        // Cartões
        Schema::create('cartoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->string('bandeira')->nullable();
            $table->string('final', 4)->nullable();
            $table->decimal('limite', 15, 2)->default(0);
            $table->integer('dia_fechamento')->default(1);
            $table->integer('dia_vencimento')->default(10);
            $table->string('cor', 7)->default('#8b5cf6');
            $table->boolean('ativo')->default(true);
            $table->timestamps();
        });

        // Ciclos de Fatura
        Schema::create('ciclos_fatura', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cartao_id')->constrained('cartoes')->onDelete('cascade');
            $table->integer('mes');
            $table->integer('ano');
            $table->date('data_inicio');
            $table->date('data_fim');
            $table->date('data_vencimento');
            $table->enum('status', ['aberta', 'fechada', 'paga'])->default('aberta');
            $table->decimal('valor_total', 15, 2)->default(0);
            $table->timestamps();
            $table->unique(['cartao_id', 'mes', 'ano']);
            $table->index(['cartao_id', 'data_inicio', 'data_fim']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ciclos_fatura');
        Schema::dropIfExists('cartoes');
        Schema::dropIfExists('contas');
        Schema::dropIfExists('subcategorias');
        Schema::dropIfExists('categorias');
        Schema::dropIfExists('responsaveis');
    }
};
