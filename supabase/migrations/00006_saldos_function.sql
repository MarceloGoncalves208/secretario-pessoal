-- Function to calculate balance matrix between companies
create or replace function public.get_matriz_saldos(p_user_id uuid)
returns table (
  origem_id uuid,
  origem_nome text,
  destino_id uuid,
  destino_nome text,
  saldo decimal
) as $$
begin
  return query
  with saldos as (
    select
      t.origem_id as oid,
      t.destino_id as did,
      sum(t.valor) as total
    from transacoes t
    where t.user_id = p_user_id
      and t.agendado = false
    group by t.origem_id, t.destino_id
  )
  select
    e1.id as origem_id,
    e1.nome as origem_nome,
    e2.id as destino_id,
    e2.nome as destino_nome,
    coalesce(s1.total, 0) - coalesce(s2.total, 0) as saldo
  from empresas e1
  cross join empresas e2
  left join saldos s1 on s1.oid = e1.id and s1.did = e2.id
  left join saldos s2 on s2.oid = e2.id and s2.did = e1.id
  where e1.user_id = p_user_id
    and e2.user_id = p_user_id
    and e1.id != e2.id
    and e1.ativa = true
    and e2.ativa = true;
end;
$$ language plpgsql security definer;
