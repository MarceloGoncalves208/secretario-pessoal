-- ============================================
-- SECRETÁRIO PESSOAL - MIGRATIONS CONSOLIDADAS
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text,
  email text,
  tema text default 'system',
  moeda text default 'BRL',
  formato_data text default 'DD/MM/YYYY',
  created_at timestamptz default now(),

  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. EMPRESAS
-- ============================================
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  descricao text,
  ativa boolean default true,
  created_at timestamptz default now(),

  unique(user_id, nome)
);

create index empresas_user_id_idx on public.empresas(user_id);
create index empresas_ativa_idx on public.empresas(ativa);

alter table public.empresas enable row level security;

create policy "Users can manage own empresas"
  on public.empresas for all
  using (auth.uid() = user_id);

-- ============================================
-- 3. CATEGORIAS
-- ============================================
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('entrada', 'saida', 'ambos')),
  cor text default '#6b7280',
  created_at timestamptz default now(),

  unique(user_id, nome)
);

create index categorias_user_id_idx on public.categorias(user_id);
create index categorias_tipo_idx on public.categorias(tipo);

alter table public.categorias enable row level security;

create policy "Users can manage own categorias"
  on public.categorias for all
  using (auth.uid() = user_id);

-- ============================================
-- 4. TRANSACOES
-- ============================================
create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor decimal(15,2) not null check (valor > 0),
  descricao text,
  data date not null,
  empresa_origem_id uuid references public.empresas(id),
  empresa_destino_id uuid references public.empresas(id),
  categoria_id uuid references public.categorias(id),
  created_at timestamptz default now()
);

create index transacoes_user_id_idx on public.transacoes(user_id);
create index transacoes_data_idx on public.transacoes(data);
create index transacoes_tipo_idx on public.transacoes(tipo);
create index transacoes_empresa_origem_idx on public.transacoes(empresa_origem_id);
create index transacoes_empresa_destino_idx on public.transacoes(empresa_destino_id);

alter table public.transacoes enable row level security;

create policy "Users can manage own transacoes"
  on public.transacoes for all
  using (auth.uid() = user_id);

-- ============================================
-- 5. TAREFAS
-- ============================================
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text not null,
  descricao text,
  data date,
  hora time,
  concluida boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index tarefas_user_id_idx on public.tarefas(user_id);
create index tarefas_data_idx on public.tarefas(data);
create index tarefas_concluida_idx on public.tarefas(concluida);

alter table public.tarefas enable row level security;

create policy "Users can manage own tarefas"
  on public.tarefas for all
  using (auth.uid() = user_id);

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tarefas_updated_at
  before update on public.tarefas
  for each row execute procedure public.update_updated_at();

-- ============================================
-- 6. FUNÇÃO DE CÁLCULO DE SALDOS
-- ============================================
create or replace function public.calcular_saldos()
returns table (
  origem_id uuid,
  origem_nome text,
  destino_id uuid,
  destino_nome text,
  saldo decimal
) as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  return query
  with fluxos as (
    select
      t.empresa_origem_id as de_empresa,
      t.empresa_destino_id as para_empresa,
      sum(t.valor) as total
    from transacoes t
    where t.user_id = current_user_id
      and t.empresa_origem_id is not null
      and t.empresa_destino_id is not null
    group by t.empresa_origem_id, t.empresa_destino_id
  ),
  pares as (
    select distinct
      e1.id as empresa1_id,
      e1.nome as empresa1_nome,
      e2.id as empresa2_id,
      e2.nome as empresa2_nome
    from empresas e1
    cross join empresas e2
    where e1.user_id = current_user_id
      and e2.user_id = current_user_id
      and e1.id < e2.id
      and e1.ativa = true
      and e2.ativa = true
  )
  select
    p.empresa1_id as origem_id,
    p.empresa1_nome as origem_nome,
    p.empresa2_id as destino_id,
    p.empresa2_nome as destino_nome,
    coalesce(f1.total, 0) - coalesce(f2.total, 0) as saldo
  from pares p
  left join fluxos f1 on f1.de_empresa = p.empresa1_id and f1.para_empresa = p.empresa2_id
  left join fluxos f2 on f2.de_empresa = p.empresa2_id and f2.para_empresa = p.empresa1_id
  where coalesce(f1.total, 0) - coalesce(f2.total, 0) != 0;
end;
$$ language plpgsql security definer;

-- ============================================
-- FIM DAS MIGRATIONS
-- ============================================
