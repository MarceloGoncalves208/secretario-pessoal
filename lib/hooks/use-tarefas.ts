'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Tarefa, TarefaFormData } from '@/types';

interface UseTarefasOptions {
  concluidas?: boolean;
  data?: string;
}

export function useTarefas(options: UseTarefasOptions = {}) {
  const supabase = createClient();

  const { data, error, isLoading, mutate } = useSWR<Tarefa[]>(
    ['tarefas', options],
    async () => {
      let query = supabase
        .from('tarefas')
        .select('*')
        .order('data', { ascending: true, nullsFirst: false })
        .order('hora', { ascending: true, nullsFirst: false });

      if (options.concluidas !== undefined) {
        query = query.eq('concluida', options.concluidas);
      }

      if (options.data) {
        query = query.eq('data', options.data);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  );

  const createTarefa = async (formData: TarefaFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        user_id: user.id,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data: formData.data || null,
        hora: formData.hora || null,
      })
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateTarefa = async (id: string, formData: Partial<TarefaFormData>) => {
    const { data, error } = await supabase
      .from('tarefas')
      .update({
        titulo: formData.titulo,
        descricao: formData.descricao,
        data: formData.data,
        hora: formData.hora,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const toggleTarefa = async (id: string, concluida: boolean) => {
    const { error } = await supabase
      .from('tarefas')
      .update({ concluida })
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  const deleteTarefa = async (id: string) => {
    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  // Group tasks by date
  const tarefasPorData = (data ?? []).reduce((acc, tarefa) => {
    const dataKey = tarefa.data || 'sem-data';
    if (!acc[dataKey]) {
      acc[dataKey] = [];
    }
    acc[dataKey].push(tarefa);
    return acc;
  }, {} as Record<string, Tarefa[]>);

  // Count stats
  const stats = {
    total: (data ?? []).length,
    concluidas: (data ?? []).filter((t) => t.concluida).length,
    pendentes: (data ?? []).filter((t) => !t.concluida).length,
  };

  return {
    tarefas: data ?? [],
    tarefasPorData,
    stats,
    isLoading,
    error,
    createTarefa,
    updateTarefa,
    toggleTarefa,
    deleteTarefa,
    mutate,
  };
}
