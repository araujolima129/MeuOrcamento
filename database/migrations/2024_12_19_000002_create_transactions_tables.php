<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Transações
        Schema::create('transacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('conta_id')->nullable()->constrained('contas')->nullOnDelete();
            $table->foreignId('cartao_id')->nullable()->constrained('cartoes')->nullOnDelete();
            $table->foreignId('ciclo_fatura_id')->nullable()->constrained('ciclos_fatura')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subcategoria_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('responsavel_id')->nullable()->constrained('responsaveis')->nullOnDelete();

            $table->date('data');
            $table->date('data_competencia')->nullable();
            $table->string('descricao_original');
            $table->string('descricao')->nullable();
            $table->decimal('valor', 15, 2);
            $table->enum('tipo', ['receita', 'despesa', 'transferencia']);
            $table->enum('forma_pagamento', ['pix', 'debito', 'credito', 'dinheiro', 'boleto', 'transferencia'])->nullable();

            $table->boolean('fixa')->default(false);
            $table->boolean('parcelada')->default(false);
            $table->integer('parcela_atual')->nullable();
            $table->integer('parcela_total')->nullable();
            $table->foreignId('transacao_pai_id')->nullable();

            $table->string('identificador_externo')->nullable();
            $table->string('hash_dedupe')->nullable();
            $table->text('observacoes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'data']);
            $table->index(['user_id', 'categoria_id']);
            $table->index(['user_id', 'cartao_id', 'ciclo_fatura_id']);
            $table->index('hash_dedupe');
        });

        // Splits de Transação (Rateio)
        Schema::create('transacao_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transacao_id')->constrained('transacoes')->onDelete('cascade');
            $table->foreignId('categoria_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subcategoria_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('valor', 15, 2);
            $table->string('descricao')->nullable();
            $table->timestamps();
        });

        // Orçamentos
        Schema::create('orcamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('categoria_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subcategoria_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('mes');
            $table->integer('ano');
            $table->decimal('valor_planejado', 15, 2);
            $table->boolean('protegido')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'categoria_id', 'subcategoria_id', 'mes', 'ano'], 'orcamentos_unique');
        });

        // Transferências de Orçamento (Redistribuição)
        Schema::create('transferencias_orcamento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('mes');
            $table->integer('ano');
            $table->foreignId('origem_categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('origem_subcategoria_id')->nullable()->constrained('subcategorias')->nullOnDelete();
            $table->foreignId('destino_categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('destino_subcategoria_id')->nullable()->constrained('subcategorias')->nullOnDelete();
            $table->decimal('valor', 15, 2);
            $table->string('motivo')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transferencias_orcamento');
        Schema::dropIfExists('orcamentos');
        Schema::dropIfExists('transacao_splits');
        Schema::dropIfExists('transacoes');
    }
};
