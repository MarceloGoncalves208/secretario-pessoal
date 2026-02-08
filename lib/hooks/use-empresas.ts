'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Empresa, EmpresaFormData } from '@/types';

export function useEmpresas() {
  const supabase = createClient();

  const { data, error, isLoading, mutate } = useSWR<Empresa[]>(
    'empresas',
    async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    }
  );

  const createEmpresa = async (formData: EmpresaFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('empresas')
      .insert({
        user_id: user.id,
        nome: formData.nome,
        descricao: formData.descricao || null,
      })
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateEmpresa = async (id: string, formData: Partial<EmpresaFormData>) => {
    const { data, error } = await supabase
      .from('empresas')
      .update({
        nome: formData.nome,
        descricao: formData.descricao,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const toggleEmpresa = async (id: string, ativa: boolean) => {
    const { error } = await supabase
      .from('empresas')
      .update({ ativa })
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  const deleteEmpresa = async (id: string) => {
    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  return {
    empresas: data ?? [],
    empresasAtivas: data?.filter(e => e.ativa) ?? [],
    isLoading,
    error,
    createEmpresa,
    updateEmpresa,
    toggleEmpresa,
    deleteEmpresa,
    mutate,
  };
}
