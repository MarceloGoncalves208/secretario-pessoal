-- Function to calculate balance matrix between companies
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
  -- Get current user
  current_user_id := auth.uid();

  return query
  with fluxos as (
    -- Money going FROM origem TO destino (when origem pays destino)
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
