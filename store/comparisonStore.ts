import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Componente } from '@/types';

interface ComparisonStore {
    items: Componente[];
    isOpen: boolean;
    addItem: (item: Componente) => void;
    removeItem: (id: string) => void;
    clear: () => void;
    setIsOpen: (isOpen: boolean) => void;
}

export const useComparisonStore = create<ComparisonStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            addItem: (item) => {
                const { items } = get();
                if (items.some(i => i.id === item.id)) return; // Already added
                if (items.length >= 3) {
                    // Optionally replace the oldest or just deny. 
                    // Let's deny for now or maybe replace first? 
                    // Standard behavior: Alert limit reached. 
                    // But for smoother UX, let's just limit to 3.
                    return;
                }
                set({ items: [...items, item] });
            },
            removeItem: (id) => {
                set((state) => ({ items: state.items.filter(i => i.id !== id) }));
            },
            clear: () => set({ items: [] }),
            setIsOpen: (isOpen) => set({ isOpen }),
        }),
        {
            name: 'comparison-store',
        }
    )
);
