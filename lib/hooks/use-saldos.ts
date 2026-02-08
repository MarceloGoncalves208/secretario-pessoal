'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Saldo } from '@/types';

export function useSaldos() {
  const supabase = createClient();

  const { data, error, isLoading, mutate } = useSWR<Saldo[]>(
    'saldos',
    async () => {
      const { data, error } = await supabase
        .rpc('calcular_saldos');

      if (error) throw error;
      return data;
    }
  );

  // Build balance matrix for display
  const buildMatrix = () => {
    if (!data) return { empresas: [], matrix: {} };

    const empresasSet = new Set<string>();
    const empresaNomes: Record<string, string> = {};

    data.forEach((s) => {
      empresasSet.add(s.origem_id);
      empresasSet.add(s.destino_id);
      empresaNomes[s.origem_id] = s.origem_nome;
      empresaNomes[s.destino_id] = s.destino_nome;
    });

    const empresas = Array.from(empresasSet).map((id) => ({
      id,
      nome: empresaNomes[id],
    }));

    const matrix: Record<string, Record<string, number>> = {};

    // Initialize matrix
    empresas.forEach((e1) => {
      matrix[e1.id] = {};
      empresas.forEach((e2) => {
        matrix[e1.id][e2.id] = 0;
      });
    });

    // Fill matrix with balances
    data.forEach((s) => {
      matrix[s.origem_id][s.destino_id] = s.saldo;
    });

    return { empresas, matrix };
  };

  // Calculate total receivables and payables per company
  const getTotaisPorEmpresa = () => {
    if (!data) return {};

    const totais: Record<string, { aReceber: number; aPagar: number; nome: string }> = {};

    data.forEach((s) => {
      if (!totais[s.origem_id]) {
        totais[s.origem_id] = { aReceber: 0, aPagar: 0, nome: s.origem_nome };
      }
      if (!totais[s.destino_id]) {
        totais[s.destino_id] = { aReceber: 0, aPagar: 0, nome: s.destino_nome };
      }

      if (s.saldo > 0) {
        // origem deve receber de destino
        totais[s.origem_id].aReceber += s.saldo;
        totais[s.destino_id].aPagar += s.saldo;
      } else if (s.saldo < 0) {
        // origem deve pagar a destino
        totais[s.origem_id].aPagar += Math.abs(s.saldo);
        totais[s.destino_id].aReceber += Math.abs(s.saldo);
      }
    });

    return totais;
  };

  return {
    saldos: data ?? [],
    matrix: buildMatrix(),
    totaisPorEmpresa: getTotaisPorEmpresa(),
    isLoading,
    error,
    mutate,
  };
}
