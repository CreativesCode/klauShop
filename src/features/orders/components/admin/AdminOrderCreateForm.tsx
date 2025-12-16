"use client";

import { PhoneInputField } from "@/components/forms/PhoneInputField";
import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { customerInfoSchema } from "@/features/orders/validations";
import type { SelectProducts } from "@/lib/supabase/schema";
import { formatPrice } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

type AdminOrderCreateProduct = Pick<
  SelectProducts,
  "id" | "name" | "price" | "stock" | "colors" | "sizes" | "materials"
>;

const adminCreateOrderSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        color: z.string().nullable().optional(),
        size: z.string().nullable().optional(),
        material: z.string().nullable().optional(),
      }),
    )
    .min(1, "Debes agregar al menos un producto"),
  customerData: customerInfoSchema,
  shippingCost: z.coerce.number().min(0).optional(),
});

type AdminCreateOrderValues = z.infer<typeof adminCreateOrderSchema>;

type CreatedOrderResult = {
  orderId: string;
  orderNumber: string;
  whatsappUrl: string;
  whatsappMessage: string;
  adminUrl: string;
};

type AdminOrderCreateFormProps = {
  products: AdminOrderCreateProduct[];
};

const NONE = "__none__";

export default function AdminOrderCreateForm({
  products,
}: AdminOrderCreateFormProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedOrderResult | null>(null);

  const productById = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const form = useForm<AdminCreateOrderValues>({
    resolver: zodResolver(adminCreateOrderSchema),
    defaultValues: {
      cartItems: [],
      shippingCost: 0,
      customerData: {
        name: "",
        phone: "",
        zone: "",
        address: "",
        notes: "",
      },
    },
  });

  const { control, watch, getValues } = form;
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "cartItems",
  });

  const cartItems = watch("cartItems");
  const shippingCost = watch("shippingCost") || 0;

  const subtotal = useMemo(() => {
    return (cartItems || []).reduce((acc, item) => {
      const p = productById.get(item.productId);
      const price = p ? parseFloat(p.price || "0") : 0;
      return acc + item.quantity * price;
    }, 0);
  }, [cartItems, productById]);

  const total = subtotal + (shippingCost || 0);

  const addProduct = (productId: string) => {
    const current = getValues("cartItems");
    const idx = current.findIndex((x) => x.productId === productId);
    if (idx >= 0) {
      const existing = current[idx];
      update(idx, { ...existing, quantity: existing.quantity + 1 });
      return;
    }

    append({
      productId,
      quantity: 1,
      color: null,
      size: null,
      material: null,
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setCreated(null);

    try {
      const payload: AdminCreateOrderValues = {
        ...values,
        shippingCost:
          values.shippingCost === undefined || Number.isNaN(values.shippingCost)
            ? undefined
            : values.shippingCost,
      };

      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "No se pudo crear la orden",
        );
      }

      setCreated(data as CreatedOrderResult);
      toast({
        title: "Orden creada",
        description: `Orden ${data.orderNumber} creada correctamente.`,
      });
    } catch (err: any) {
      console.error("Admin order create error:", err);
      toast({
        title: "Error",
        description: err.message || "Ocurrió un error creando la orden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="mb-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Selector de productos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Buscar producto por nombre..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Badge variant="secondary">{filteredProducts.length}</Badge>
              </div>

              <div className="max-h-[360px] overflow-auto rounded-md border">
                <div className="divide-y">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-sm text-muted-foreground flex gap-2">
                          <span>{formatPrice(Number(p.price || 0))}</span>
                          {typeof p.stock === "number" && (
                            <span>Stock: {p.stock}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addProduct(p.id)}
                      >
                        <Icons.add className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  ))}

                  {filteredProducts.length === 0 && (
                    <div className="p-6 text-sm text-muted-foreground">
                      No hay productos que coincidan con tu búsqueda.
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items seleccionados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Items seleccionados</div>
                  <Badge variant="outline">{fields.length}</Badge>
                </div>

                {fields.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Agrega productos para armar la orden.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const p = productById.get(field.productId);
                      const colors = (p?.colors || []) as string[];
                      const sizes = (p?.sizes || []) as string[];
                      const materials = (p?.materials || []) as string[];

                      return (
                        <div
                          key={field.id}
                          className="rounded-md border p-3 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {p?.name || "Producto"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {p ? formatPrice(Number(p.price || 0)) : "—"}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              aria-label="Eliminar producto"
                            >
                              <Icons.close className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid gap-3 md:grid-cols-4">
                            <FormField
                              control={control}
                              name={`cartItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cantidad</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={field.value ?? 1}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        const v = parseInt(raw || "1", 10);
                                        field.onChange(
                                          Number.isFinite(v) ? v : 1,
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`cartItems.${index}.color`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color</FormLabel>
                                  <Select
                                    value={(field.value ?? null) || NONE}
                                    onValueChange={(v) =>
                                      field.onChange(v === NONE ? null : v)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sin especificar" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={NONE}>
                                        Sin especificar
                                      </SelectItem>
                                      {colors.map((c) => (
                                        <SelectItem key={c} value={c}>
                                          <span className="inline-flex items-center gap-2">
                                            <span
                                              className="h-3 w-3 rounded-sm border"
                                              style={{ backgroundColor: c }}
                                            />
                                            {c}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`cartItems.${index}.size`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Talla</FormLabel>
                                  <Select
                                    value={(field.value ?? null) || NONE}
                                    onValueChange={(v) =>
                                      field.onChange(v === NONE ? null : v)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sin especificar" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={NONE}>
                                        Sin especificar
                                      </SelectItem>
                                      {sizes.map((s) => (
                                        <SelectItem key={s} value={s}>
                                          {s}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={control}
                              name={`cartItems.${index}.material`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Material</FormLabel>
                                  <Select
                                    value={(field.value ?? null) || NONE}
                                    onValueChange={(v) =>
                                      field.onChange(v === NONE ? null : v)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sin especificar" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value={NONE}>
                                        Sin especificar
                                      </SelectItem>
                                      {materials.map((m) => (
                                        <SelectItem key={m} value={m}>
                                          {m}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Formulario + resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente & Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <FormField
                  control={control}
                  name="customerData.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customerData.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <PhoneInputField field={field} />
                      </FormControl>
                      <FormDescription>
                        Selecciona el país y escribe solo el número (sin el
                        +código).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customerData.zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Santa Clara..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customerData.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección (opcional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customerData.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas (opcional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={control}
                name="shippingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de envío</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            field.onChange(undefined);
                            return;
                          }
                          const v = Number(raw);
                          field.onChange(Number.isFinite(v) ? v : 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>{formatPrice(Number(shippingCost || 0))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear orden"}
              </Button>

              {created && (
                <div className="rounded-md border p-3 space-y-3">
                  <div className="font-medium">
                    Orden creada:{" "}
                    <span className="font-semibold">{created.orderNumber}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="default">
                      <a
                        href={created.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir WhatsApp
                      </a>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            created.whatsappMessage,
                          );
                          toast({
                            title: "Copiado",
                            description:
                              "Mensaje de WhatsApp copiado al portapapeles.",
                          });
                        } catch {
                          toast({
                            title: "No se pudo copiar",
                            description:
                              "Tu navegador no permitió copiar el mensaje.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Copiar mensaje
                    </Button>

                    <Button asChild variant="secondary">
                      <Link href={`/admin/orders/${created.orderId}`}>
                        Ver detalle en admin
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              <Button asChild variant="ghost" className="w-full">
                <Link href="/admin/orders">Volver a órdenes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
