import { persistNSync } from "persist-and-sync";
import { create } from "zustand";

export type CartItem = {
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

export type CartItems = { [productId: string]: CartItem };
export type ProductData = {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

type CartStore = {
  cart: CartItems;
  addProductToCart: (
    id: string,
    quantity: number,
    color?: string | null,
    size?: string | null,
    material?: string | null,
  ) => void;
  removeProduct: (id: string) => void;
  removeAllProducts: () => void;
};

// Helper para crear clave única basada en producto y opciones
function createCartKey(
  productId: string,
  color?: string | null,
  size?: string | null,
  material?: string | null,
): string {
  return `${productId}-${color || "none"}-${size || "none"}-${material || "none"}`;
}

const useCartStore = create<CartStore>(
  persistNSync(
    (set) => ({
      cart: {},
      addProductToCart: async (id, quantity, color, size, material) => {
        set((state) => {
          // Crear clave única para esta combinación
          const cartKey = createCartKey(id, color, size, material);
          const existingProduct = state.cart[cartKey];

          const newQuantity = existingProduct
            ? existingProduct.quantity + quantity
            : quantity;

          return {
            cart: {
              ...state.cart,
              [cartKey]: { quantity: newQuantity, color, size, material },
            },
          };
        });
      },
      removeProduct: (cartKey) =>
        set((state) => {
          const updatedCart = { ...state.cart };
          delete updatedCart[cartKey];
          return {
            cart: updatedCart,
          };
        }),
      removeAllProducts: () => set(() => ({ cart: {} })),
    }),
    // localStorage only: the old cookie copy travelled (unused) in every request
    { name: "cart", storage: "localStorage" },
  ),
);

// Expire the "cart" cookies written by the old cookie storage. They had no path, so the
// browser scoped them to each page's folder ("/", "/shop", "/collections"...).
if (typeof document !== "undefined" && document.cookie.includes("cart=")) {
  const folders = new Set(["/"]);
  const parts = window.location.pathname.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) {
    folders.add("/" + parts.slice(0, i).join("/"));
  }
  ["/shop", "/collections", "/orders", "/setting", "/sign-in"].forEach((p) =>
    folders.add(p),
  );
  folders.forEach((path) => {
    document.cookie = `cart=; max-age=0; path=${path}`;
  });
}

// El `cartKey` se construye como:
// `${productId}-${color||"none"}-${size||"none"}-${material||"none"}`
// Ojo: si `productId` es UUID, contiene guiones. Por eso NO podemos usar split("-")[0].
const getProductIdFromCartKey = (cartKey: string) => {
  const parts = cartKey.split("-");
  // Si por algún motivo no tiene opciones, devolvemos el key completo
  if (parts.length <= 3) return cartKey;
  return parts.slice(0, -3).join("-");
};

export { createCartKey, getProductIdFromCartKey };

export const calcProductCountStorage = (cartItems: CartItems) => {
  if (!cartItems) return 0;
  return Object.values(cartItems).reduce((acc, cur) => acc + cur.quantity, 0);
};

export default useCartStore;
