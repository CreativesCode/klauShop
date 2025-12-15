"use client";
import { DocumentType, gql } from "@/gql";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn, formatPrice, keytoUrl } from "@/lib/utils";
import dayjs from "dayjs";
import "dayjs/locale/es";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icons } from "../../../components/layouts/icons";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { getOrderStatusInfo } from "../utils/orderStatus";
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
      order_status
      created_at
      item: order_linesCollection {
        edges {
          node {
            id
            quantity
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

  if (orders.length === 0) return <div>There is no order.</div>;
  return (
    <div className="flex flex-col gap-y-5">
      <div className="grid gap-y-5">
        {orders.map(({ node: order }) => {
          const statusInfo = getOrderStatusInfo(
            order.order_status as OrderStatus,
          );
          const StatusIcon = statusInfo?.icon;

          return (
            <Card key={order.id} className="w-full overflow-hidden">
              <CardHeader className="px-3 sm:px-6 py-3 grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-between bg-zinc-100 gap-x-3 gap-y-2 sm:gap-3 rounded-t-md">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-medium text-xs whitespace-nowrap">Fecha</p>
                  <p className="text-xs sm:text-sm truncate">
                    {dayjs(order.created_at)
                      .locale("es")
                      .format("DD MMMM, YYYY")}
                  </p>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-medium text-xs whitespace-nowrap">Total</p>
                  <p className="text-xs sm:text-sm truncate">
                    {formatPrice(order.amount)}
                  </p>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-medium text-xs whitespace-nowrap">
                    Id de pedido
                  </p>
                  <p className="text-xs sm:text-sm truncate">
                    {formatOrderNumber(order.id)}
                  </p>
                </div>

                {statusInfo && (
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="font-medium text-xs mb-1 whitespace-nowrap">
                      Estado
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md w-full sm:w-fit",
                        statusInfo.color,
                        statusInfo.bgColor,
                        statusInfo.borderColor,
                      )}
                    >
                      {StatusIcon && (
                        <StatusIcon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      )}
                      <span className="text-[10px] sm:text-xs font-medium truncate flex-1 min-w-0">
                        {statusInfo.label}
                      </span>
                    </Badge>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-3 sm:p-6 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 w-full">
                  <div className="flex flex-col gap-5 md:col-span-8 max-w-full min-w-0">
                    {order.item.edges.map(({ node }) => {
                      const product = node.products;
                      // Buscar la reserva de inventario correspondiente
                      const reservation =
                        order.inventory_reservationsCollection?.edges.find(
                          ({ node: res }) => res.product_id === product.id,
                        )?.node;

                      return (
                        <div className="flex items-center gap-5" key={node.id}>
                          <div className="relative w-[120px] h-[120px] min-w-[80px]">
                            <Image
                              width={120}
                              height={120}
                              src={keytoUrl(product.featuredImage.key)}
                              alt={product.featuredImage.alt}
                              className="object-cover w-[120px] h-[120px] rounded-md"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/shop/${product.slug}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {product.name}
                            </Link>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <p>
                                Cantidad:{" "}
                                <span className="font-medium text-foreground">
                                  {node.quantity}
                                </span>
                              </p>
                              {reservation && (
                                <>
                                  {reservation.color && (
                                    <p>
                                      Color:{" "}
                                      <span
                                        className="font-medium text-foreground h-4 w-4 rounded-full inline-block"
                                        style={{
                                          backgroundColor: reservation.color,
                                        }}
                                      ></span>
                                    </p>
                                  )}
                                  {reservation.size && (
                                    <p>
                                      Tamaño:{" "}
                                      <span className="font-medium text-foreground">
                                        {reservation.size}
                                      </span>
                                    </p>
                                  )}
                                  {reservation.material && (
                                    <p>
                                      Material:{" "}
                                      <span className="font-medium text-foreground">
                                        {reservation.material}
                                      </span>
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <section className="md:col-span-4 flex flex-col gap-3 max-w-full min-w-0">
                    <Link
                      href={`/orders/${order.id}`}
                      className={cn(buttonVariants(), "w-full max-w-full")}
                    >
                      Seguimiento de paquete
                    </Link>
                    {/* TODO: Add feedback buttons */}
                    {/* <Button variant="outline" disabled>
                    Leave seller feedback
                  </Button> */}
                    {/* TODO: Add review button */}
                    {/* <Button variant="outline" disabled>
                    write a product review
                  </Button> */}
                  </section>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(pageInfo.hasNextPage || pageInfo.hasPreviousPage) && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={!pageInfo.hasPreviousPage}
            className="flex items-center gap-2"
          >
            <Icons.chevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={!pageInfo.hasNextPage}
            className="flex items-center gap-2"
          >
            Siguiente
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default OrdersList;
