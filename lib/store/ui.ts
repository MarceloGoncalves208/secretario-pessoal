import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  transacaoModalOpen: boolean;
  tarefaModalOpen: boolean;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTransacaoModalOpen: (open: boolean) => void;
  setTarefaModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  transacaoModalOpen: false,
  tarefaModalOpen: false,
  commandPaletteOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTransacaoModalOpen: (open) => set({ transacaoModalOpen: open }),
  setTarefaModalOpen: (open) => set({ tarefaModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
