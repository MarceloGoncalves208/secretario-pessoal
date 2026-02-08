import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'custom';

interface FiltersState {
  periodo: Periodo;
  dataInicio: string | null;
  dataFim: string | null;
  empresaId: string | null;
  categoriaId: string | null;
  setPeriodo: (periodo: Periodo) => void;
  setDataRange: (inicio: string | null, fim: string | null) => void;
  setEmpresaId: (id: string | null) => void;
  setCategoriaId: (id: string | null) => void;
  clearFilters: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      periodo: 'mes',
      dataInicio: null,
      dataFim: null,
      empresaId: null,
      categoriaId: null,
      setPeriodo: (periodo) => set({ periodo }),
      setDataRange: (dataInicio, dataFim) => set({ dataInicio, dataFim }),
      setEmpresaId: (empresaId) => set({ empresaId }),
      setCategoriaId: (categoriaId) => set({ categoriaId }),
      clearFilters: () =>
        set({
          periodo: 'mes',
          dataInicio: null,
          dataFim: null,
          empresaId: null,
          categoriaId: null,
        }),
    }),
    {
      name: 'secretario-filters',
    }
  )
);
