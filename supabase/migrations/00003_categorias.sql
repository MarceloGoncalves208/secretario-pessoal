-- Categorias table
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  tipo text not null check (tipo in ('entrada', 'saida', 'ambos')),
  cor text default '#6b7280',
  created_at timestamptz default now(),

  unique(user_id, nome)
);

-- Indexes
create index categorias_user_id_idx on public.categorias(user_id);
create index categorias_tipo_idx on public.categorias(tipo);

-- Enable RLS
alter table public.categorias enable row level security;

-- Policies
create policy "Users can manage own categorias"
  on public.categorias for all
  using (auth.uid() = user_id);
