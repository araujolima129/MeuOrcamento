# MeuOrçamento

Sistema de gestão financeira pessoal desenvolvido em **Laravel 12** + **React/TypeScript** com **Inertia.js**.

![Licença](https://img.shields.io/badge/licença-MIT-blue)
![PHP](https://img.shields.io/badge/PHP-8.3%2B-purple)
![Laravel](https://img.shields.io/badge/Laravel-12-red)
![React](https://img.shields.io/badge/React-18-blue)

## 📋 Visão Geral

MeuOrçamento é uma aplicação web para controle de finanças pessoais e familiares. O sistema permite:

- 📊 **Dashboard** com visão geral de receitas, despesas e saldo
- 💳 **Gestão de Cartões** com ciclos de fatura e fechamento automático
- 📁 **Categorias** personalizáveis com subcategorias
- 💰 **Transações** com suporte a parcelamento automático
- 📎 **Importação de Extratos** (OFX, CSV, TXT) com detecção de duplicatas
- 🎯 **Metas Financeiras** com acompanhamento de aportes
- 📈 **Orçamentos** mensais por categoria
- 👥 **Responsáveis** para controle de gastos por pessoa
- 🧾 **Faturas Consolidadas** - transações de cartão separadas do orçamento

## 🛠️ Stack Tecnológica

### Backend
- **PHP 8.3+**
- **Laravel 12** - Framework PHP
- **SQLite** (desenvolvimento) / **MySQL** (produção)
- **Inertia.js** - Integração SPA com Laravel

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Recharts** - Gráficos

## 📁 Estrutura do Projeto

```
MeuOrcamento/
├── app/
│   ├── Http/Controllers/    # Controllers da aplicação
│   ├── Models/              # Models Eloquent
│   ├── Policies/            # Policies de autorização
│   ├── Console/Commands/    # Comandos Artisan customizados
│   └── Services/            # Serviços de negócio
│       ├── Parsers/         # Parsers de importação (OFX, CSV, TXT, Parcela)
│       ├── ImportService.php        # Serviço de importação
│       ├── DedupeService.php        # Detecção de duplicatas
│       ├── StatementCycleService.php # Ciclos de fatura e fechamento
│       ├── BudgetService.php        # Cálculo de orçamento
│       └── RecurrenceService.php    # Transações recorrentes
├── database/
│   └── migrations/          # Migrations do banco
├── resources/
│   └── js/
│       ├── Components/      # Componentes React reutilizáveis
│       ├── Layouts/         # Layout da aplicação
│       └── Pages/           # Páginas por módulo
│           ├── Dashboard.tsx
│           ├── Transacoes/
│           ├── Categorias/
│           ├── Cartoes/
│           ├── Orcamento/
│           ├── Metas/
│           └── Importar/
└── routes/
    └── web.php              # Rotas da aplicação
```

## 🚀 Instalação

### Pré-requisitos
- PHP 8.3+
- Composer
- Node.js 18+
- NPM ou Yarn

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/meuorcamento.git
   cd meuorcamento
   ```

2. **Instale dependências PHP**
   ```bash
   composer install
   ```

3. **Instale dependências JavaScript**
   ```bash
   npm install
   ```

4. **Configure o ambiente**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Execute as migrations**
   ```bash
   php artisan migrate
   ```

6. **Inicie os servidores de desenvolvimento**
   ```bash
   # Terminal 1 - Laravel
   php artisan serve
   
   # Terminal 2 - Vite
   npm run dev
   ```

7. **Acesse a aplicação**
   ```
   http://127.0.0.1:8000
   ```

## 📝 Funcionalidades Detalhadas

### Dashboard
- Cards de resumo: Receitas, Despesas, Saldo, Orçamento restante
- Gráfico de despesas por categoria (Pizza)
- Gráfico de evolução mensal (Barras)
- Últimas transações
- Gastos por responsável
- **Fechamento automático de faturas** ao acessar

### Transações
- Listagem com filtros por mês, tipo, categoria, responsável
- **Opção "Todos"** para ver transações de todos os meses
- Busca por descrição
- Cadastro rápido de receitas e despesas
- Suporte a transações fixas (recorrentes)
- **Detecção automática de parcelas** (PARC XX/YY)
- **Badge visual** para transações parceladas
- Divisão de transação em múltiplas categorias (Split)

### Categorias
- Categorias de receita e despesa
- Subcategorias
- Cores e ícones personalizáveis

### Cartões e Contas
- Gestão de cartões de crédito com limite e ciclo de fatura
- Gestão de contas bancárias
- **Campo limite opcional** para cartões
- Visualização de ciclos de fatura

### 💳 Sistema de Faturas (NOVO)

#### Conceito: Competência vs Caixa
O sistema separa corretamente:
- **Transações** aparecem na **data da compra** (regime de competência)
- **Orçamento** é impactado na **data do vencimento da fatura** (regime de caixa)

#### Fluxo Automático
1. Compra no cartão em 15/12 → aparece em Transações de Dezembro
2. Fatura fecha em 20/12 → ciclo marcado como fechado
3. Fatura consolidada criada → "Fatura Cartão X - Janeiro/2025"
4. Vencimento 10/01 → **impacta orçamento de Janeiro**

#### Parcelas Automáticas
- Sistema detecta padrões: `PARC 02/12`, `02/12`, `Parcela 2 de 12`
- Cria automaticamente as parcelas futuras
- Cada parcela entra na fatura do mês correspondente

### Importação de Extratos
- Suporte a formatos OFX, CSV e TXT
- Preview antes de importar
- **Detecção inteligente de duplicatas** (mesmo arquivo em cartões diferentes)
- **Detecção automática de parcelas** com criação de parcelas futuras
- Mapeamento de colunas para CSV
- **Renomear importações** no histórico

### Orçamentos
- Planejamento mensal por categoria
- Acompanhamento de uso vs planejado
- Redistribuição de saldo entre categorias
- **Exclui transações de cartão** (apenas faturas consolidadas contam)

### Metas
- Criação de objetivos financeiros
- Registro de aportes
- Acompanhamento visual de progresso

## 🗄️ Modelo de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `categorias` | Categorias de transação |
| `subcategorias` | Subcategorias |
| `contas` | Contas bancárias |
| `cartoes` | Cartões de crédito |
| `ciclos_fatura` | Ciclos de fatura de cartões |
| `transacoes` | Transações financeiras |
| `transacao_splits` | Divisões de transações |
| `orcamentos` | Orçamentos mensais |
| `metas` | Metas financeiras |
| `meta_aportes` | Aportes em metas |
| `responsaveis` | Responsáveis por transação |
| `importacoes` | Histórico de importações |
| `importacao_itens` | Itens de importação |

### Campos Importantes em Transações

| Campo | Descrição |
|-------|-----------|
| `cartao_id` | Se preenchido, é transação de cartão (NÃO impacta orçamento) |
| `ciclo_fatura_id` | Ciclo de fatura ao qual pertence |
| `parcelada` | Se é transação parcelada |
| `parcela_atual` | Número da parcela atual |
| `parcela_total` | Total de parcelas |
| `transacao_pai_id` | Agrupa parcelas da mesma compra |
| `forma_pagamento` | Se = 'fatura_cartao', é fatura consolidada |
| `hash_dedupe` | Hash para detecção de duplicatas |

## 🔐 Autenticação

O sistema utiliza **Laravel Breeze** com React/Inertia para autenticação:

- Registro de novos usuários
- Login/Logout
- Recuperação de senha
- Verificação de e-mail

## 🧪 Comandos Úteis

```bash
# Executar migrations
php artisan migrate

# Recriar banco (CUIDADO: apaga todos os dados)
php artisan migrate:fresh

# Recalcular hashes de deduplicação
php artisan dedupe:recalculate
php artisan dedupe:recalculate --user=1  # Apenas usuário específico

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Build de produção
npm run build

# Verificar erros TypeScript
npm run build
```

## 🏗️ Arquitetura de Serviços

### ImportService
Responsável pela importação de arquivos OFX/CSV/TXT:
- Usa parsers específicos para cada formato
- Detecta parcelas automaticamente via `ParcelaParser`
- Associa transações ao ciclo de fatura via `StatementCycleService`
- Detecta duplicatas via `DedupeService`
- Cria parcelas futuras automaticamente

### StatementCycleService
Gerencia ciclos de fatura de cartões:
- `getCicloParaData()` - Obtém ou cria ciclo para uma data
- `fecharCiclo()` - Fecha ciclo e cria fatura consolidada
- `fecharCiclosAutomaticamente()` - Fecha ciclos que já passaram (chamado no Dashboard)
- `atribuirTransacaoAoCiclo()` - Associa transação ao ciclo correto

### DedupeService
Detecta transações duplicadas:
- Gera hash baseado em: data, valor, descrição, identificador
- **NÃO usa cartao_id/conta_id** no hash (detecta duplicatas entre cartões diferentes)

### ParcelaParser
Detecta e extrai informações de parcelas:
- Padrões suportados: `PARC 02/12`, `02/12`, `Parcela 2 de 12`
- Retorna: `parcela_atual`, `parcela_total`, `descricao_limpa`

## 🚢 Deploy

### Hostinger/cPanel

1. Configure o PHP para versão 8.3+
2. Crie banco MySQL
3. Execute `npm run build` localmente
4. Faça upload dos arquivos (exceto `node_modules`)
5. Configure `.env` com credenciais de produção
6. Execute `composer install --no-dev`
7. Execute `php artisan migrate`
8. Configure o document root para `/public`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Guia de Desenvolvimento

#### Adicionando novo parser de importação
1. Crie classe em `app/Services/Parsers/` implementando `ParserInterface`
2. Registre no array `$parsers` em `ImportService`

#### Adicionando novo padrão de parcela
1. Adicione regex no array `$patterns` em `ParcelaParser`

#### Modificando cálculo de orçamento
1. Lembre-se: transações com `cartao_id != null` NÃO contam
2. Faturas consolidadas (`forma_pagamento = 'fatura_cartao'`) SIM contam

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido como projeto de gestão financeira pessoal.
