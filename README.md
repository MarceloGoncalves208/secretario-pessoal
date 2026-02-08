# Secretário Pessoal

Aplicativo pessoal para gestão financeira entre múltiplas empresas e controle de tarefas.

## Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **IA:** Claude API (Anthropic)
- **Deploy:** Vercel

## Funcionalidades

- Gestão de transações entre empresas
- Matriz de saldos (quem deve para quem)
- Agenda de tarefas e pagamentos
- Chat com IA para comandos rápidos
- Tema claro/escuro
- Autenticação via Magic Link

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

### 3. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie as credenciais para `.env.local`
3. Execute as migrations em `supabase/migrations/`

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
secretario-pessoal/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas públicas (login)
│   ├── (dashboard)/       # Rotas protegidas
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui
│   ├── layout/           # Header, Sidebar
│   └── ...               # Componentes por feature
├── lib/                   # Utilitários
│   ├── supabase/         # Clientes Supabase
│   ├── store/            # Zustand stores
│   └── hooks/            # Custom hooks
├── types/                 # TypeScript types
└── supabase/             # Migrations SQL
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Verificar código |

## Atalhos do App

| Atalho | Ação |
|--------|------|
| `/p` | Nova transação |
| `/t` | Nova tarefa |
| `/s` | Matriz de saldos |
| `Ctrl+K` | Command palette |

## License

Private - Uso pessoal
