# MeuOrçamento

Sistema de gestão financeira pessoal desenvolvido em **Laravel 12** + **React/TypeScript** com **Inertia.js**.

![Licença](https://img.shields.io/badge/licença-MIT-blue)
![PHP](https://img.shields.io/badge/PHP-8.3%2B-purple)
![Laravel](https://img.shields.io/badge/Laravel-12-red)
![React](https://img.shields.io/badge/React-18-blue)

## 📋 Visão Geral

MeuOrçamento é uma aplicação web para controle de finanças pessoais e familiares. O sistema permite:

- 📊 **Dashboard** com visão geral de receitas, despesas e saldo
- 💳 **Gestão de Cartões** e contas bancárias
- 📁 **Categorias** personalizáveis com subcategorias
- 💰 **Transações** com suporte a parcelamento e recorrência
- 📎 **Importação de Extratos** (OFX, CSV, TXT)
- 🎯 **Metas Financeiras** com acompanhamento de aportes
- 📈 **Orçamentos** mensais por categoria
- 👥 **Responsáveis** para controle de gastos por pessoa

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
│   └── Services/            # Serviços de negócio
│       └── Parsers/         # Parsers de importação (OFX, CSV, TXT)
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

### Transações
- Listagem com filtros por mês, tipo, categoria, responsável
- Busca por descrição
- Cadastro rápido de receitas e despesas
- Suporte a transações fixas (recorrentes)
- Suporte a parcelamento
- Divisão de transação em múltiplas categorias (Split)

### Categorias
- Categorias de receita e despesa
- Subcategorias
- Cores e ícones personalizáveis

### Cartões e Contas
- Gestão de cartões de crédito com limite e ciclo de fatura
- Gestão de contas bancárias
- Visualização de ciclos de fatura

### Importação de Extratos
- Suporte a formatos OFX, CSV e TXT
- Preview antes de importar
- Detecção automática de duplicatas
- Mapeamento de colunas para CSV

### Orçamentos
- Planejamento mensal por categoria
- Acompanhamento de uso vs planejado
- Redistribuição de saldo entre categorias

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

# Limpar caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Build de produção
npm run build

# Verificar erros TypeScript
npm run build
```

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

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido como projeto de gestão financeira pessoal.
