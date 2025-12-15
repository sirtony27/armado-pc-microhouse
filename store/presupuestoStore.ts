import { create } from 'zustand';
import { ItemPresupuesto } from '@/types';

interface PresupuestoStore {
    items: ItemPresupuesto[];
    addItem: (item: Omit<ItemPresupuesto, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearPresupuesto: () => void;
    totalEstimado: () => number;
}

export const usePresupuestoStore = create<PresupuestoStore>((set, get) => ({
    items: [],

    addItem: (item) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            items: [...state.items, { ...item, id }]
        }));
    },

    removeItem: (id) => {
        set((state) => ({
            items: state.items.filter((i) => i.id !== id)
        }));
    },

    updateQuantity: (id, quantity) => {
        set((state) => ({
            items: state.items.map((i) =>
                i.id === id ? { ...i, cantidad: Math.max(1, quantity) } : i
            )
        }));
    },

    clearPresupuesto: () => set({ items: [] }),

    totalEstimado: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    }
}));
