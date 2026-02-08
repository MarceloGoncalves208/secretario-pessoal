-- Transacoes table
create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data date not null,
  hora time,
  valor decimal(15,2) not null check (valor > 0),
  origem_id uuid references public.empresas(id) not null,
  destino_id uuid references public.empresas(id) not null,
  categoria_id uuid references public.categorias(id),
  descricao text,
  agendado boolean default false,
  data_agendamento timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  check (origem_id != destino_id)
);

-- Indexes
create index transacoes_user_id_idx on public.transacoes(user_id);
create index transacoes_data_idx on public.transacoes(data);
create index transacoes_origem_idx on public.transacoes(origem_id);
create index transacoes_destino_idx on public.transacoes(destino_id);
create index transacoes_agendado_idx on public.transacoes(agendado);

-- Enable RLS
alter table public.transacoes enable row level security;

-- Policies
create policy "Users can manage own transacoes"
  on public.transacoes for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger transacoes_updated_at
  before update on public.transacoes
  for each row execute procedure public.update_updated_at();
