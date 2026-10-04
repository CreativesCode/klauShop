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

function AddToWishListButton({ productId }: Props) {
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
  return (
    <Button
      className="rounded-full p-0 md:p-1 bg-primary-50 justify-center shadow-md"
      variant="secondary"
      size="icon"
      onClick={onClickHandler}
    >
      <Icons.heart
        className={cn(
          "md:w-6 md:h-6 w-4 h-4",
          wishlist[productId]
            ? "fill-primary stroke-primary"
            : "fill-none stroke-primary",
        )}
      />
    </Button>
  );
}

export default AddToWishListButton;
