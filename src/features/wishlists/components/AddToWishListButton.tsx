"use client";
import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { gql } from "@/gql";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useMutation } from "@urql/next";
import { useRouter } from "next/navigation";
import useWishlistStore from "../useWishlistStore";

type Props = {
  productId: string;
  className?: string;
};

const AddProductToWishList = gql(/* GraphQL */ `
  mutation AddProductToWishList($productId: String, $userId: UUID) {
    insertIntowishlistCollection(
      objects: { user_id: $userId, product_id: $productId }
    ) {
      affectedCount
      records {
        __typename
        user_id
        product_id
      }
    }
  }
`);
const RemoveWishlistItemMutation = gql(/* GraphQL */ `
  mutation RemoveWishlistItemMutation($productId: String, $userId: UUID) {
    deleteFromwishlistCollection(
      filter: {
        and: [{ user_id: { eq: $userId } }, { product_id: { eq: $productId } }]
      }
      atMost: 1
    ) {
      records {
        __typename
      }
    }
  }
`);

function AddToWishListButton({ productId, className }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const wishlist = useWishlistStore((s) => s.wishlist);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishItem);

  const [, addToWishlist] = useMutation(AddProductToWishList);
  const [, removeWishlistItem] = useMutation(RemoveWishlistItemMutation);

  const onClickHandler = async () => {
    if (!user) {
      router.push("/sign-in");
    } else {
      if (wishlist[productId]) {
        const res = await removeWishlistItem({ productId, userId: user.id });
        if (res.data) toast({ title: "Quitado de tus favoritos." });
      } else {
        const res = await addToWishlist({ productId, userId: user.id });
        if (res.data) toast({ title: "Añadido a tus favoritos." });
      }

      toggleWishlist(productId);
    }
  };
  const isSaved = !!wishlist[productId];
  return (
    <Button
      className={cn(
        "size-10 rounded-full bg-white/90 p-0 text-ink backdrop-blur hover:bg-white",
        className,
      )}
      variant="ghost"
      size="icon"
      aria-label={isSaved ? "Quitar de favoritos" : "Añadir a favoritos"}
      aria-pressed={isSaved}
      onClick={onClickHandler}
    >
      <Icons.heart
        aria-hidden
        className={cn(
          "size-[19px]",
          isSaved ? "fill-primary stroke-primary" : "fill-none stroke-current",
        )}
      />
    </Button>
  );
}

export default AddToWishListButton;
