import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { OutOfStockError, ProductNotFoundError } from "./inventory";

// Shared by the customer checkout and the admin manual order

export function invalidJsonResponse() {
  return NextResponse.json(
    {
      error: "INVALID_JSON",
      message: "No se pudo leer el pedido. Inténtalo de nuevo.",
    },
    { status: 400 },
  );
}

export function invalidDataResponse(zodError: ZodError) {
  // customerData fields carry Spanish messages; anything else is a malformed request
  const customerIssue = zodError.issues.find(
    (issue) => issue.path[0] === "customerData",
  );
  return NextResponse.json(
    {
      error: "Datos inválidos",
      message:
        customerIssue?.message ??
        "Revisa los datos del pedido e inténtalo de nuevo.",
      details: zodError.errors,
    },
    { status: 400 },
  );
}

/** 409 for stock/catalog problems the customer can fix; null for anything else. */
export function cartConflictResponse(error: unknown) {
  if (error instanceof OutOfStockError) {
    return NextResponse.json(
      {
        error: "INSUFFICIENT_STOCK",
        message: error.message,
        items: error.items,
      },
      { status: 409 },
    );
  }
  if (error instanceof ProductNotFoundError) {
    return NextResponse.json(
      {
        error: "PRODUCT_NOT_FOUND",
        message: error.message,
        productIds: error.productIds,
      },
      { status: 409 },
    );
  }
  return null;
}
