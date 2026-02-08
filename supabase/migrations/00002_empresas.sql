-- Empresas table
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  descricao text,
  ativa boolean default true,
  created_at timestamptz default now(),

  unique(user_id, nome)
);

-- Indexes
create index empresas_user_id_idx on public.empresas(user_id);
create index empresas_ativa_idx on public.empresas(ativa);

-- Enable RLS
alter table public.empresas enable row level security;

-- Policies
create policy "Users can manage own empresas"
  on public.empresas for all
  using (auth.uid() = user_id);
