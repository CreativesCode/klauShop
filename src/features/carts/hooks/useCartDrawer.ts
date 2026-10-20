import { create } from "zustand";

/** Open state of the cart drawer (opened from the header cart buttons). */
export const useCartDrawer = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
