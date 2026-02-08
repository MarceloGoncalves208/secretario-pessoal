-- Transacoes table
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

-- Indexes
create index transacoes_user_id_idx on public.transacoes(user_id);
create index transacoes_data_idx on public.transacoes(data);
create index transacoes_tipo_idx on public.transacoes(tipo);
create index transacoes_empresa_origem_idx on public.transacoes(empresa_origem_id);
create index transacoes_empresa_destino_idx on public.transacoes(empresa_destino_id);

-- Enable RLS
alter table public.transacoes enable row level security;

-- Policies
create policy "Users can manage own transacoes"
  on public.transacoes for all
  using (auth.uid() = user_id);
