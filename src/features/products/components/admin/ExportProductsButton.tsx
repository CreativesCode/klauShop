"use client";

import { Button } from "@/components/ui/button";
import { DocumentType } from "@/gql";
import { ProductColumnFragment } from "./ProductsColumns";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportProductsButtonProps {
  products: Array<{
    node: DocumentType<typeof ProductColumnFragment>;
  }>;
}

// Función para normalizar arrays (pueden venir como array o string JSON)
function normalizeToArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function ExportProductsButton({ products }: ExportProductsButtonProps) {
  const handleExport = () => {
    // Preparar los datos para Excel
    const excelData = products.map((item) => {
      const product = item.node;

      // Normalizar los arrays
      const colors = normalizeToArray(product.colors);
      const sizes = normalizeToArray(product.sizes);
      const materials = normalizeToArray(product.materials);

      // Formatear valores
      const price = parseFloat(product.price?.toString() || "0");
      const discount = product.discount
        ? parseFloat(product.discount.toString())
        : 0;
      const stock = product.stock ?? 0;
      const finalPrice =
        discount > 0 ? price - (price * discount) / 100 : price;

      return {
        Nombre: product.name,
        Color: colors.join(", ") || "-",
        Tallas: sizes.join(", ") || "-",
        Material: materials.join(", ") || "-",
        Precio: price,
        Descuento: discount > 0 ? `${discount}%` : "-",
        "Precio Final": finalPrice,
        Cantidad: stock,
      };
    });

    // Crear el workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Ajustar el ancho de las columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 20 }, // Color
      { wch: 20 }, // Tallas
      { wch: 20 }, // Material
      { wch: 12 }, // Precio
      { wch: 12 }, // Descuento
      { wch: 12 }, // Precio Final
      { wch: 12 }, // Cantidad
    ];
    ws["!cols"] = colWidths;

    // Generar el archivo Excel
    const fileName = `productos_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Exportar a Excel
    </Button>
  );
}
