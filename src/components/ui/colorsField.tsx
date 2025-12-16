"use client";
import { ChangeEvent, FC, KeyboardEvent, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Icons } from "../layouts/icons";
import { Badge } from "./badge";
import { Input } from "./input";

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const addColor = () => {
    // Validar que sea un color hexadecimal válido
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (input && hexColorRegex.test(input) && !colors.includes(input)) {
      setColors([...colors, input]);
      setInput("");
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
        Ingresa colores en formato hexadecimal (ej: #FF0000) o usa el selector
        de color
      </p>
    </div>
  );
};

export default ColorsField;
