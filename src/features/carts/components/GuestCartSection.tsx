"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { WhatsAppCheckoutButton } from "@/features/orders/components/WhatsAppCheckoutButton";
import { DocumentType, gql } from "@/gql";
import { useQuery } from "@urql/next";
import { useMemo, useState } from "react";
import useCartStore, {
  CartItems,
  calcProductCountStorage,
} from "../useCartStore";
import CartItemCard from "./CartItemCard";
import EmptyCart from "./EmptyCart";

// El `cartKey` se construye como:
// `${productId}-${color||"none"}-${size||"none"}-${material||"none"}`
// Ojo: si `productId` es UUID, contiene guiones. Por eso NO podemos usar split("-")[0].
const getProductIdFromCartKey = (cartKey: string) => {
  const parts = cartKey.split("-");
  // Si por algún motivo no tiene opciones, devolvemos el key completo
  if (parts.length <= 3) return cartKey;
  return parts.slice(0, -3).join("-");
};

function GuestCartSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const cartItems = useCartStore((s) => s.cart);
  const addProductToCart = useCartStore((s) => s.addProductToCart);
  const removeProduct = useCartStore((s) => s.removeProduct);

  // Extraer IDs únicos de productos (sin las opciones)
  const productIds = useMemo(
    () =>
      Array.from(new Set(Object.keys(cartItems).map(getProductIdFromCartKey))),
    [cartItems],
  );

  const [{ data, fetching, error }, _] = useQuery({
    query: FetchGuestCartQuery,
    variables: {
      cartItems: productIds,
      first: 8,
    },
    pause: productIds.length === 0, // Pausar query si no hay productos
  });

  const subtotal = useMemo(
    () => calcSubtotal({ prdouctsDetails: data, quantity: cartItems }),
    [data, cartItems],
  );

  const productCount = useMemo(
    () => calcProductCountStorage(cartItems),
    [cartItems],
  );
  if (fetching && productIds.length > 0) return LoadingCartSection();
  if (error) return <div>Error</div>;

  // Si no hay productos en el carrito, mostrar EmptyCart
  if (Object.keys(cartItems).length === 0) {
    return <EmptyCart />;
  }

  // Si no hay datos aún pero hay productos, mostrar loading
  if (!data && productIds.length > 0) {
    return LoadingCartSection();
  }

  const addOneHandler = (cartKey: string, quantity: number) => {
    setIsLoading(true);
    try {
      if (quantity < 8) {
        const currentItem = cartItems[cartKey];
        // Extraer el productId de la clave (formato: productId-color-size-material)
        const productId = getProductIdFromCartKey(cartKey);
        addProductToCart(
          productId,
          1,
          currentItem?.color,
          currentItem?.size,
          currentItem?.material,
        );
      } else {
        toast({ title: "Product Limit is reached." });
      }
    } finally {
      setIsLoading(false);
    }
  };
  const minusOneHandler = (cartKey: string, quantity: number) => {
    if (quantity > 1) {
      setIsLoading(true);
      try {
        const currentItem = cartItems[cartKey];
        const productId = getProductIdFromCartKey(cartKey);
        addProductToCart(
          productId,
          -1,
          currentItem?.color,
          currentItem?.size,
          currentItem?.material,
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({ title: "Minimum is reached." });
    }
  };
  const removeHandler = (cartKey: string) => {
    setIsLoading(true);
    try {
      removeProduct(cartKey);
      // Verificar si el carrito quedará vacío después de eliminar
      const remainingItems = Object.keys(cartItems).filter(
        (key) => key !== cartKey,
      );

      if (remainingItems.length === 0) {
        toast({ title: "Carrito vaciado." });
      } else {
        toast({ title: "Removed a Product." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-label="Cart Section"
      className="grid grid-cols-12 gap-x-6 gap-y-5"
    >
      <div className="col-span-12 md:col-span-9 overflow-y-auto space-y-3">
        {data?.productsCollection.edges.flatMap(({ node }) => {
          // Encontrar todas las combinaciones de este producto en el carrito
          return Object.entries(cartItems)
            .filter(([key]) => getProductIdFromCartKey(key) === node.id)
            .map(([cartKey, item]) => (
              <CartItemCard
                key={cartKey}
                id={cartKey}
                product={node}
                quantity={item.quantity}
                selectedColor={item.color}
                selectedSize={item.size}
                selectedMaterial={item.material}
                addOneHandler={() => addOneHandler(cartKey, item.quantity)}
                minusOneHandler={() => minusOneHandler(cartKey, item.quantity)}
                removeHandler={() => removeHandler(cartKey)}
                disabled={isLoading}
              />
            ));
        })}
      </div>

      <Card className="w-full h-[180px] px-3 col-span-12 md:col-span-3">
        <CardHeader className="px-3 pt-2 pb-0 text-md">
          <CardTitle className="text-lg mb-0">Subtotal: </CardTitle>
          <CardDescription>{`${productCount} producto${productCount > 1 ? "s" : ""}`}</CardDescription>
        </CardHeader>
        <CardContent className="relative overflow-hidden px-3 py-2">
          <p className="text-3xl md:text-lg lg:text-2xl font-bold">{`$ ${subtotal.toFixed(2).toString()}`}</p>
        </CardContent>

        <CardFooter className="gap-x-2 md:gap-x-5 px-3 flex-col gap-y-3">
          <WhatsAppCheckoutButton
            cartItems={
              data?.productsCollection.edges.flatMap(({ node }) => {
                return Object.entries(cartItems)
                  .filter(([key]) => getProductIdFromCartKey(key) === node.id)
                  .map(([, item]) => ({
                    productId: node.id,
                    quantity: item.quantity,
                    color: item.color,
                    size: item.size,
                    material: item.material,
                  }));
              }) || []
            }
            disabled={isLoading}
            className="w-full"
          />
        </CardFooter>
      </Card>
    </section>
  );
}

export default GuestCartSection;

export const LoadingCartSection = () => (
  <section
    className="grid grid-cols-12 gap-x-6 gap-y-5"
    aria-label="Loading Skeleton"
  >
    <div className="col-span-12 md:col-span-9 space-y-8">
      {[...Array(4)].map((_, index) => (
        <div
          className="flex items-center justify-between gap-x-6 gap-y-8 border-b p-5"
          key={index}
        >
          <Skeleton className="h-[120px] w-[120px]" />
          <div className="space-y-3 w-full">
            <Skeleton className="h-6 max-w-xs" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="w-full h-[180px] px-3 col-span-12 md:col-span-3 border p-5">
      <div className="space-y-3 w-full">
        <Skeleton className="h-6 max-w-xs" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4 mb-6" />
        <Skeleton className="h-4 mb-6 max-w-[280px]" />
      </div>
    </div>
  </section>
);

const calcSubtotal = ({
  prdouctsDetails,
  quantity,
}: {
  prdouctsDetails: DocumentType<typeof FetchGuestCartQuery>;
  quantity: CartItems;
}) => {
  const productPrices =
    prdouctsDetails && prdouctsDetails.productsCollection.edges
      ? prdouctsDetails.productsCollection.edges
      : [];

  if (!productPrices.length) return 0;

  // Sumar todas las combinaciones de cada producto considerando descuentos
  return productPrices.reduce((acc, cur) => {
    const price = Number(cur.node.price || 0);
    const discount = Number(cur.node.discount || 0);
    const discountedPrice =
      discount > 0 ? price - (price * discount) / 100 : price;

    const productSubtotal = Object.entries(quantity)
      .filter(([key]) => key.startsWith(cur.node.id + "-"))
      .reduce((sum, [_, item]) => sum + item.quantity * discountedPrice, 0);
    return acc + productSubtotal;
  }, 0);
};

const FetchGuestCartQuery = gql(/* GraphQL */ `
  query FetchGuestCartQuery(
    $cartItems: [String!]
    $first: Int
    $after: Cursor
  ) {
    productsCollection(
      first: $first
      after: $after
      filter: { id: { in: $cartItems } }
    ) {
      edges {
        node {
          id
          ...CartItemCardFragment
        }
      }
    }
  }
`);
