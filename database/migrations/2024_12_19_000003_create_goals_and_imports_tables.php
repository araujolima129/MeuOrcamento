<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Metas
        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->string('icone')->nullable();
            $table->decimal('valor_alvo', 15, 2);
            $table->decimal('valor_condicao_parcelas', 15, 2)->nullable();
            $table->date('data_limite')->nullable();
            $table->enum('status', ['ativa', 'atingida', 'cancelada'])->default('ativa');
            $table->timestamps();
        });

        // Aportes de Metas
        Schema::create('meta_aportes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meta_id')->constrained()->onDelete('cascade');
            $table->date('data');
            $table->decimal('valor', 15, 2);
            $table->text('observacao')->nullable();
            $table->timestamps();
        });

        // Importações
        Schema::create('importacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('conta_id')->nullable()->constrained('contas')->nullOnDelete();
            $table->foreignId('cartao_id')->nullable()->constrained('cartoes')->nullOnDelete();
            $table->string('arquivo_original');
            $table->string('arquivo_path');
            $table->enum('tipo', ['ofx', 'csv', 'txt']);
            $table->json('mapeamento')->nullable();
            $table->enum('status', ['pendente', 'processando', 'concluida', 'com_alertas', 'falhou'])->default('pendente');
            $table->integer('total_itens')->default(0);
            $table->integer('itens_importados')->default(0);
            $table->integer('itens_duplicados')->default(0);
            $table->integer('itens_erro')->default(0);
            $table->text('log')->nullable();
            $table->timestamps();
        });

        // Itens de Importação
        Schema::create('importacao_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('importacao_id')->constrained('importacoes')->onDelete('cascade');
            $table->foreignId('transacao_id')->nullable()->constrained('transacoes')->nullOnDelete();
            $table->json('dados_originais');
            $table->string('hash_dedupe');
            $table->enum('status', ['pendente', 'importado', 'duplicado', 'ignorado', 'erro'])->default('pendente');
            $table->string('erro')->nullable();
            $table->timestamps();
            $table->index('hash_dedupe');
        });

        // Logs de Auditoria
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->enum('action', ['create', 'update', 'delete']);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip')->nullable();
            $table->timestamps();
            $table->index(['model_type', 'model_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('importacao_itens');
        Schema::dropIfExists('importacoes');
        Schema::dropIfExists('meta_aportes');
        Schema::dropIfExists('metas');
    }
};
