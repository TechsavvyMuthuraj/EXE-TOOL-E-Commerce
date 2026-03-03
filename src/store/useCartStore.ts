import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // usually product_slug + license_tier
    productId: string;
    slug: string;
    title: string;
    price: number;
    licenseTier: string;
    image: string;
    downloadLink?: string; // per-tier download URL set in admin
    paymentLink?: string; // custom direct payment URL
    couponPaymentLink?: string; // custom direct payment URL for discounted price
}

interface CartState {
    items: CartItem[];
    isDrawerOpen: boolean;
    couponCode: string | null;
    discountPercentage: number;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    toggleDrawer: () => void;
    openDrawer: () => void;
    closeDrawer: () => void;
    getCartTotal: () => number;
    getDiscountedTotal: () => number;
    applyCoupon: (code: string, percentage: number) => void;
    removeCoupon: () => void;
}
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,
            couponCode: null,
            discountPercentage: 0,
            addItem: (item) => {
                set((state) => {
                    // Check if item already exists
                    const exists = state.items.find((i) => i.id === item.id);
                    if (exists) return state; // Prevent duplicates of same license for same product
                    return { items: [...state.items, item] };
                });
            },
            removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
            clearCart: () => set({ items: [], couponCode: null, discountPercentage: 0 }),
            toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
            openDrawer: () => set({ isDrawerOpen: true }),
            closeDrawer: () => set({ isDrawerOpen: false }),
            getCartTotal: () => {
                return get().items.reduce((total, item) => total + item.price, 0);
            },
            getDiscountedTotal: () => {
                const total = get().items.reduce((total, item) => total + item.price, 0);
                const discount = total * (get().discountPercentage / 100);
                return Math.max(0, parseFloat((total - discount).toFixed(2)));
            },
            applyCoupon: (code, percentage) => set({ couponCode: code, discountPercentage: percentage }),
            removeCoupon: () => set({ couponCode: null, discountPercentage: 0 })
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({ items: state.items }), // Only persist items, not UI state
        }
    )
);
