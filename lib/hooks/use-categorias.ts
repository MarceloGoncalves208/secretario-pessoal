'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Categoria, CategoriaFormData } from '@/types';

export function useCategorias() {
  const supabase = createClient();

  const { data, error, isLoading, mutate } = useSWR<Categoria[]>(
    'categorias',
    async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    }
  );

  const createCategoria = async (formData: CategoriaFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('categorias')
      .insert({
        user_id: user.id,
        nome: formData.nome,
        tipo: formData.tipo,
        cor: formData.cor,
      })
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const updateCategoria = async (id: string, formData: Partial<CategoriaFormData>) => {
    const { data, error } = await supabase
      .from('categorias')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    mutate();
    return data;
  };

  const deleteCategoria = async (id: string) => {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) throw error;
    mutate();
  };

  return {
    categorias: data ?? [],
    isLoading,
    error,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    mutate,
  };
}
