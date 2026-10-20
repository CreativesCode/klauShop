"use client";
import { DocumentType, gql } from "@/gql";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn, formatCUP, keytoUrl } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "../../../components/layouts/icons";
import { Button, buttonVariants } from "../../../components/ui/button";
import { colorName } from "@/lib/colorName";
import {
  formatOrderTotal,
  formatShipping,
  getOrderTotals,
} from "../utils/pricing";
import OrderLinePrice from "./OrderLinePrice";
import { StatusPill } from "./StatusPill";
import { formatOrderNumber } from "../utils/whatsapp";

type OrdersListProps = {
  orders: DocumentType<typeof OrdersListFragment>[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    endCursor?: string | null;
    startCursor?: string | null;
  };
};

export const OrdersListFragment = gql(/* GraphQL */ `
  fragment OrdersListFragment on ordersEdge {
    node {
      id
      amount
      shipping_cost
      zone
      order_status
      created_at
      item: order_linesCollection {
        edges {
          node {
            id
            quantity
            price
            list_price
            discount
            products {
              id
              featured
              price
              discount
              name
              slug
              description
              featuredImage: medias {
                id
                key
                alt
              }
            }
          }
        }
      }
      inventory_reservationsCollection {
        edges {
          node {
            id
            product_id
            color
            size
            material
            quantity
          }
        }
      }
    }
  }
`);

function OrdersList({ orders, pageInfo }: OrdersListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleNextPage = () => {
    if (pageInfo.endCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("after", pageInfo.endCursor);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("after");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (orders.length === 0)
    return (
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-line bg-white px-6 py-12 text-center">
        <p className="text-[15px] text-neutral-500">
          Todavía no tienes pedidos.
        </p>
        <Link href="/shop" className={buttonVariants({ size: "lg" })}>
          Ver novedades
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {orders.map(({ node: order }) => {
        const { subtotal, shippingCost, total } = getOrderTotals(order);

        return (
          <article
            key={order.id}
            className="overflow-hidden rounded-[18px] border border-line bg-white"
          >
            <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-line-soft px-4 py-3.5 md:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-extrabold text-ink">
                  {formatOrderNumber(order.id)}
                </h2>
                {order.order_status && (
                  <StatusPill status={order.order_status as OrderStatus} />
                )}
              </div>
              <p className="text-[13px] text-neutral-500">
                {dayjs(order.created_at)
                  .locale("es")
                  .format("D [de] MMMM, YYYY")}
              </p>
            </header>

            <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:p-5">
              <ul className="flex min-w-0 flex-col gap-3.5">
                {order.item.edges.map(({ node }) => {
                  const product = node.products;
                  // Buscar la reserva de inventario correspondiente
                  const reservation =
                    order.inventory_reservationsCollection?.edges.find(
                      ({ node: res }) => res.product_id === product.id,
                    )?.node;

                  return (
                    <li className="flex items-start gap-3" key={node.id}>
                      <span className="relative h-[72px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-surface-tint">
                        <Image
                          fill
                          sizes="60px"
                          src={keytoUrl(product.featuredImage.key)}
                          alt={product.featuredImage.alt || product.name}
                          className="object-cover"
                        />
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link
                          href={`/shop/${product.slug}`}
                          className="line-clamp-2 text-sm font-bold text-ink hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-neutral-600">
                          <span className="rounded-md bg-surface-soft px-2 py-0.5">
                            Cant. {node.quantity}
                          </span>
                          {reservation?.size && (
                            <span className="rounded-md bg-surface-soft px-2 py-0.5">
                              Talla {reservation.size}
                            </span>
                          )}
                          {reservation?.color && (
                            <span className="flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 capitalize">
                              <span
                                className="size-2.5 rounded-full ring-1 ring-inset ring-black/10"
                                style={{ backgroundColor: reservation.color }}
                                aria-hidden
                              />
                              {colorName(reservation.color)}
                            </span>
                          )}
                          {reservation?.material && (
                            <span className="rounded-md bg-surface-soft px-2 py-0.5">
                              {reservation.material}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          <OrderLinePrice
                            price={node.price}
                            listPrice={node.list_price}
                            discount={node.discount}
                          />{" "}
                          c/u
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold tabular-nums text-ink">
                        {formatCUP(Number(node.price) * node.quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <section className="flex flex-col gap-3">
                <dl className="flex flex-col gap-2 rounded-xl bg-surface-hover p-3.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-600">Subtotal</dt>
                    <dd className="tabular-nums text-ink">
                      {formatCUP(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-600">Envío</dt>
                    <dd
                      className={cn(
                        "text-right",
                        shippingCost === null
                          ? "font-bold text-accent-700"
                          : "text-ink",
                      )}
                    >
                      {formatShipping(shippingCost, order.zone)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-line pt-2">
                    <dt className="font-extrabold text-ink">Total</dt>
                    <dd className="font-extrabold tabular-nums text-ink">
                      {formatOrderTotal(total, shippingCost)}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/orders/${order.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full",
                  )}
                >
                  Ver seguimiento
                </Link>
              </section>
            </div>
          </article>
        );
      })}

      {(pageInfo.hasNextPage || pageInfo.hasPreviousPage) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePreviousPage}
            disabled={!pageInfo.hasPreviousPage}
          >
            <Icons.chevronLeft className="size-4" aria-hidden />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNextPage}
            disabled={!pageInfo.hasNextPage}
          >
            Siguiente
            <Icons.chevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrdersList;
