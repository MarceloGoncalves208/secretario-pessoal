'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Transacao, TransacaoFormData } from '@/types';

interface UseTransacoesOptions {
  empresaOrigemId?: string;
  empresaDestinoId?: string;
  categoriaId?: string;
  tipo?: 'entrada' | 'saida';
  dataInicio?: string;
  dataFim?: string;
}

export function useTransacoes(options: UseTransacoesOptions = {}) {
  const supabase = createClient();

  const { data, error, isLoading, mutate } = useSWR<Transacao[]>(
    ['transacoes', options],
    async () => {
      let query = supabase
        .from('transacoes')
        .select(`
          *,
          empresa_origem:empresas!transacoes_empresa_origem_id_fkey(id, nome),
          empresa_destino:empresas!transacoes_empresa_destino_id_fkey(id, nome),
          categoria:categorias(id, nome, cor)
        `)
        .order('data', { ascending: false });

      if (options.empresaOrigemId) {
        query = query.eq('empresa_origem_id', options.empresaOrigemId);
      }
      if (options.empresaDestinoId) {
        query = query.eq('empresa_destino_id', options.empresaDestinoId);
      }
      if (options.categoriaId) {
        query = query.eq('categoria_id', options.categoriaId);
      }
      if (options.tipo) {
        query = query.eq('tipo', options.tipo);
      }
      if (options.dataInicio) {
        query = query.gte('data', options.dataInicio);
      }
      if (options.dataFim) {
        query = query.lte('data', options.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  );

  const createTransacao = async (formData: TransacaoFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('transacoes')
      .insert({
        user_id: user.id,
        tipo: formData.tipo,
        valor: formData.valor,
        descricao: formData.descricao,
        data: formData.data,
        empresa_origem_id: formData.empresa_origem_id || null,
        empresa_destino_id: formData.empresa_destino_id || null,
        categoria_id: formData.categoria_id || null,
      })
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateTransacao = async (id: string, formData: Partial<TransacaoFormData>) => {
    const { data, error } = await supabase
      .from('transacoes')
      .update({
        tipo: formData.tipo,
        valor: formData.valor,
        descricao: formData.descricao,
        data: formData.data,
        empresa_origem_id: formData.empresa_origem_id || null,
        empresa_destino_id: formData.empresa_destino_id || null,
        categoria_id: formData.categoria_id || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const deleteTransacao = async (id: string) => {
    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  // Calculate totals
  const totais = {
    entradas: (data ?? [])
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0),
    saidas: (data ?? [])
      .filter((t) => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0),
    get saldo() {
      return this.entradas - this.saidas;
    },
  };

  return {
    transacoes: data ?? [],
    isLoading,
    error,
    totais,
    createTransacao,
    updateTransacao,
    deleteTransacao,
    mutate,
  };
}
