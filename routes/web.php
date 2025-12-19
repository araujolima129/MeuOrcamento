<?php

use App\Http\Controllers\CartaoController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImportacaoController;
use App\Http\Controllers\MetaController;
use App\Http\Controllers\OrcamentoController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransacaoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Rotas autenticadas
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Categorias
    Route::get('/categorias', [CategoriaController::class, 'index'])->name('categorias.index');
    Route::post('/categorias', [CategoriaController::class, 'store'])->name('categorias.store');
    Route::put('/categorias/{categoria}', [CategoriaController::class, 'update'])->name('categorias.update');
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('categorias.destroy');
    Route::post('/categorias/{categoria}/subcategorias', [CategoriaController::class, 'storeSubcategoria'])->name('subcategorias.store');
    Route::put('/subcategorias/{subcategoria}', [CategoriaController::class, 'updateSubcategoria'])->name('subcategorias.update');
    Route::delete('/subcategorias/{subcategoria}', [CategoriaController::class, 'destroySubcategoria'])->name('subcategorias.destroy');

    // Orçamentos
    Route::get('/orcamento', [OrcamentoController::class, 'index'])->name('orcamento.index');
    Route::post('/orcamento', [OrcamentoController::class, 'store'])->name('orcamento.store');
    Route::put('/orcamento/{orcamento}', [OrcamentoController::class, 'update'])->name('orcamento.update');
    Route::delete('/orcamento/{orcamento}', [OrcamentoController::class, 'destroy'])->name('orcamento.destroy');
    Route::post('/orcamento/copiar', [OrcamentoController::class, 'copiar'])->name('orcamento.copiar');
    Route::get('/orcamento/redistribuicao', [OrcamentoController::class, 'sugerirRedistribuicao'])->name('orcamento.redistribuicao');
    Route::post('/orcamento/redistribuicao', [OrcamentoController::class, 'aplicarRedistribuicao'])->name('orcamento.aplicar-redistribuicao');

    // Transações
    Route::get('/transacoes', [TransacaoController::class, 'index'])->name('transacoes.index');
    Route::post('/transacoes', [TransacaoController::class, 'store'])->name('transacoes.store');
    Route::put('/transacoes/{transacao}', [TransacaoController::class, 'update'])->name('transacoes.update');
    Route::delete('/transacoes/{transacao}', [TransacaoController::class, 'destroy'])->name('transacoes.destroy');
    Route::get('/transacoes/{transacao}/splits', [TransacaoController::class, 'splits'])->name('transacoes.splits');
    Route::post('/transacoes/{transacao}/splits', [TransacaoController::class, 'saveSplits'])->name('transacoes.save-splits');

    // Contas e Cartões
    Route::get('/cartoes', [CartaoController::class, 'index'])->name('cartoes.index');
    Route::post('/contas', [CartaoController::class, 'storeConta'])->name('contas.store');
    Route::put('/contas/{conta}', [CartaoController::class, 'updateConta'])->name('contas.update');
    Route::delete('/contas/{conta}', [CartaoController::class, 'destroyConta'])->name('contas.destroy');
    Route::post('/cartoes', [CartaoController::class, 'storeCartao'])->name('cartoes.store');
    Route::put('/cartoes/{cartao}', [CartaoController::class, 'updateCartao'])->name('cartoes.update');
    Route::delete('/cartoes/{cartao}', [CartaoController::class, 'destroyCartao'])->name('cartoes.destroy');
    Route::get('/cartoes/{cartao}/ciclos', [CartaoController::class, 'ciclos'])->name('cartoes.ciclos');
    Route::post('/ciclos/{ciclo}/fechar', [CartaoController::class, 'fecharCiclo'])->name('ciclos.fechar');
    Route::post('/ciclos/{ciclo}/pagar', [CartaoController::class, 'pagarCiclo'])->name('ciclos.pagar');

    // Importação
    Route::get('/importar', [ImportacaoController::class, 'index'])->name('importar.index');
    Route::post('/importar/upload', [ImportacaoController::class, 'upload'])->name('importar.upload');
    Route::get('/importar/{importacao}/preview', [ImportacaoController::class, 'preview'])->name('importar.preview');
    Route::post('/importar/{importacao}/mapeamento', [ImportacaoController::class, 'saveMapping'])->name('importar.mapeamento');
    Route::post('/importar/{importacao}/processar', [ImportacaoController::class, 'processar'])->name('importar.processar');
    Route::get('/importar/{importacao}/status', [ImportacaoController::class, 'status'])->name('importar.status');

    // Metas
    Route::get('/metas', [MetaController::class, 'index'])->name('metas.index');
    Route::post('/metas', [MetaController::class, 'store'])->name('metas.store');
    Route::put('/metas/{meta}', [MetaController::class, 'update'])->name('metas.update');
    Route::delete('/metas/{meta}', [MetaController::class, 'destroy'])->name('metas.destroy');
    Route::get('/metas/{meta}/aportes', [MetaController::class, 'aportes'])->name('metas.aportes');
    Route::post('/metas/{meta}/aportes', [MetaController::class, 'storeAporte'])->name('metas.store-aporte');
    Route::delete('/aportes/{aporte}', [MetaController::class, 'destroyAporte'])->name('aportes.destroy');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';

