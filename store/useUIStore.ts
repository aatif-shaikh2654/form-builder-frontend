import { create } from 'zustand';

export type ActiveAppTab = 'builder' | 'forms';

interface UIState {
  activeTab: ActiveAppTab;
  isSidebarOpen: boolean;
  setActiveTab: (tab: ActiveAppTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'forms',
  isSidebarOpen: true,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
