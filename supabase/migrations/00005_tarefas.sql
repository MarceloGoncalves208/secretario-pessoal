-- Tarefas table
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

-- Indexes
create index tarefas_user_id_idx on public.tarefas(user_id);
create index tarefas_data_idx on public.tarefas(data);
create index tarefas_concluida_idx on public.tarefas(concluida);

-- Enable RLS
alter table public.tarefas enable row level security;

-- Policies
create policy "Users can manage own tarefas"
  on public.tarefas for all
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger tarefas_updated_at
  before update on public.tarefas
  for each row execute procedure public.update_updated_at();
