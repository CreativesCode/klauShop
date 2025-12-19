"use client";
import { cn } from "@/lib/utils";
import { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Icons } from "../layouts/icons";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Colores comunes organizados por categorías
const COMMON_COLORS = {
  Rojos: [
    "#FF0000",
    "#DC143C",
    "#B22222",
    "#8B0000",
    "#FF6347",
    "#FF4500",
    "#FF1493",
    "#C71585",
    "#FF69B4",
    "#FFB6C1",
    "#FFC0CB",
    "#FFA07A",
  ],
  Azules: [
    "#0000FF",
    "#0000CD",
    "#00008B",
    "#191970",
    "#4169E1",
    "#1E90FF",
    "#00BFFF",
    "#87CEEB",
    "#87CEFA",
    "#B0E0E6",
    "#ADD8E6",
    "#E0F6FF",
  ],
  Verdes: [
    "#008000",
    "#006400",
    "#228B22",
    "#32CD32",
    "#00FF00",
    "#7CFC00",
    "#90EE90",
    "#98FB98",
    "#ADFF2F",
    "#9ACD32",
    "#6B8E23",
    "#556B2F",
  ],
  Amarillos: [
    "#FFFF00",
    "#FFD700",
    "#FFA500",
    "#FF8C00",
    "#F0E68C",
    "#FFFFE0",
    "#FFFACD",
    "#FAFAD2",
    "#FFEFD5",
    "#FFE4B5",
    "#FFDAB9",
  ],
  Morados: [
    "#800080",
    "#4B0082",
    "#6A0DAD",
    "#8B008B",
    "#9932CC",
    "#BA55D3",
    "#DA70D6",
    "#DDA0DD",
    "#EE82EE",
    "#FF00FF",
    "#FF1493",
    "#C71585",
  ],
  Naranjas: [
    "#FF4500",
    "#FF6347",
    "#FF7F50",
    "#FF8C00",
    "#FFA500",
    "#FFD700",
    "#FFA07A",
  ],
  Grises: [
    "#000000",
    "#1C1C1C",
    "#363636",
    "#4F4F4F",
    "#696969",
    "#808080",
    "#A9A9A9",
    "#C0C0C0",
    "#D3D3D3",
    "#DCDCDC",
    "#E5E5E5",
    "#FFFFFF",
  ],
  Marrones: [
    "#8B4513",
    "#A0522D",
    "#CD853F",
    "#DEB887",
    "#F4A460",
    "#D2691E",
    "#B8860B",
    "#BC8F8F",
    "#D2B48C",
    "#DAA520",
  ],
  Turquesas: [
    "#00CED1",
    "#48D1CC",
    "#40E0D0",
    "#00FFFF",
    "#7FFFD4",
    "#66CDAA",
    "#20B2AA",
    "#008B8B",
    "#5F9EA0",
    "#4682B4",
    "#B0C4DE",
  ],
};

interface ColorsFieldProps {
  name: string;
  defaultValue?: string[];
}

export const ColorsField: FC<ColorsFieldProps> = ({ name, defaultValue }) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValue || []}
      render={({ field: { onChange, onBlur, value } }) => (
        <ColorsInput
          colors={value || []}
          setColors={onChange}
          onBlur={onBlur}
        />
      )}
    />
  );
};

interface ColorsInputProps {
  colors: string[];
  setColors: (newColors: string[]) => void;
  onBlur: () => void;
}

const ColorsInput: FC<ColorsInputProps> = ({ colors, setColors, onBlur }) => {
  const [input, setInput] = useState<string>("");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const addColor = (colorToAdd?: string) => {
    const color = colorToAdd || input;
    // Validar que sea un color hexadecimal válido
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (color && hexColorRegex.test(color) && !colors.includes(color)) {
      setColors([...colors, color]);
      setInput("");
      if (colorToAdd) {
        setIsPaletteOpen(false);
      }
    }
  };

  const removeColor = (indexToRemove: number) => {
    setColors(colors.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addColor();
    }
  };

  const handleBlur = () => {
    onBlur();
  };

  const handleColorSelect = (color: string) => {
    addColor(color);
  };

  return (
    <div className="space-y-2">
      <div className="relative flex flex-wrap items-center border border-input bg-background p-2 gap-x-3 gap-y-4 rounded-md">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: color }}
            />
            <Badge className="rounded-full">
              {color}
              <button
                type="button"
                onClick={() => removeColor(index)}
                className="text-white ml-2"
              >
                <Icons.close height={10} width={10} />
              </button>
            </Badge>
          </div>
        ))}

        <Input
          variant="ghost"
          className="h-6 mx-2 w-32 flex-grow"
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="#FFFFFF o #FFF"
          onBlur={handleBlur}
        />

        <Popover open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
            >
              Paleta
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="start">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <h4 className="font-medium text-sm mb-3">Colores comunes</h4>
              {Object.entries(COMMON_COLORS).map(([category, colorList]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h5>
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                    {colorList.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={cn(
                          "w-8 h-8 rounded border-2 transition-all hover:scale-110 cursor-pointer",
                          colors.includes(color)
                            ? "border-primary ring-2 ring-primary ring-offset-1"
                            : "border-gray-300 hover:border-gray-400",
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Seleccionar color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <input
          type="color"
          className="h-8 w-8 cursor-pointer border-0 rounded"
          onChange={(e) => {
            setInput(e.target.value);
            setTimeout(() => {
              if (e.target.value && !colors.includes(e.target.value)) {
                setColors([...colors, e.target.value]);
                setInput("");
              }
            }, 100);
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Ingresa colores en formato hexadecimal (ej: #FF0000), selecciona de la
        paleta o usa el selector de color
      </p>
    </div>
  );
};

export default ColorsField;
