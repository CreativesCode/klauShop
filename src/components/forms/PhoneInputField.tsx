"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";

export type CountryOption = {
  iso2: string;
  name: string;
  dialCode: string; // e.g. "53"
};

// Lista ligera (enfocada a LATAM + algunos comunes)
export const COUNTRIES: CountryOption[] = [
  { iso2: "CU", name: "Cuba", dialCode: "53" },
  { iso2: "US", name: "Estados Unidos", dialCode: "1" },
  { iso2: "CA", name: "Canadá", dialCode: "1" },
  { iso2: "MX", name: "México", dialCode: "52" },
  { iso2: "ES", name: "España", dialCode: "34" },
  { iso2: "DO", name: "República Dominicana", dialCode: "1" },
  { iso2: "PR", name: "Puerto Rico", dialCode: "1" },
  { iso2: "CO", name: "Colombia", dialCode: "57" },
  { iso2: "VE", name: "Venezuela", dialCode: "58" },
  { iso2: "AR", name: "Argentina", dialCode: "54" },
  { iso2: "CL", name: "Chile", dialCode: "56" },
  { iso2: "PE", name: "Perú", dialCode: "51" },
  { iso2: "EC", name: "Ecuador", dialCode: "593" },
  { iso2: "BO", name: "Bolivia", dialCode: "591" },
  { iso2: "PY", name: "Paraguay", dialCode: "595" },
  { iso2: "UY", name: "Uruguay", dialCode: "598" },
  { iso2: "BR", name: "Brasil", dialCode: "55" },
  { iso2: "GT", name: "Guatemala", dialCode: "502" },
  { iso2: "HN", name: "Honduras", dialCode: "504" },
  { iso2: "SV", name: "El Salvador", dialCode: "503" },
  { iso2: "NI", name: "Nicaragua", dialCode: "505" },
  { iso2: "CR", name: "Costa Rica", dialCode: "506" },
  { iso2: "PA", name: "Panamá", dialCode: "507" },
  { iso2: "JM", name: "Jamaica", dialCode: "1" },
  { iso2: "HT", name: "Haití", dialCode: "509" },
];

export const DEFAULT_COUNTRY_ISO2 = "CU";

export function normalizePhoneInput(value: string) {
  // Permite: dígitos, espacios, guiones, paréntesis y "+"
  return value.replace(/[^\d+\s().-]/g, "");
}

export function splitPhoneByCountry(value: string) {
  const cleaned = normalizePhoneInput(value.trim());

  // Si no viene con '+', asumimos número nacional + país por defecto
  if (!cleaned.startsWith("+")) {
    const country =
      COUNTRIES.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2) ?? COUNTRIES[0];
    return { country, nationalNumber: cleaned.replace(/[^\d\s().-]/g, "") };
  }

  // Intentar detectar el dialCode por coincidencia más larga
  const digits = cleaned.replace(/[^\d+]/g, "");
  const afterPlus = digits.startsWith("+") ? digits.slice(1) : digits;
  const dialCodes = Array.from(new Set(COUNTRIES.map((c) => c.dialCode))).sort(
    (a, b) => b.length - a.length,
  );

  const matchedDial = dialCodes.find((d) => afterPlus.startsWith(d));
  if (!matchedDial) {
    const country =
      COUNTRIES.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2) ?? COUNTRIES[0];
    return {
      country,
      nationalNumber: cleaned.replace(/[^\d\s().-]/g, ""),
    };
  }

  const country =
    COUNTRIES.find((c) => c.dialCode === matchedDial) ??
    COUNTRIES.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2) ??
    COUNTRIES[0];

  const rest = afterPlus.slice(matchedDial.length);
  return {
    country,
    nationalNumber: rest,
  };
}

export function composeInternationalPhone(
  country: CountryOption,
  nationalNumber: string,
) {
  const cleanedNational = normalizePhoneInput(nationalNumber)
    .replace(/\+/g, "")
    .trim();
  return `+${country.dialCode}${cleanedNational ? ` ${cleanedNational}` : ""}`.trim();
}

type PhoneInputFieldProps = {
  field: {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<HTMLInputElement>;
  };
  disabled?: boolean;
  description?: string;
};

export function PhoneInputField({
  field,
  disabled = false,
  description = "Selecciona el país y escribe solo el número (sin el +código).",
}: PhoneInputFieldProps) {
  const initialSplit = React.useMemo(
    () => splitPhoneByCountry(field.value || ""),
    [field.value],
  );

  const [countryOpen, setCountryOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<CountryOption>(
    initialSplit.country,
  );
  const [nationalNumber, setNationalNumber] = React.useState(
    initialSplit.nationalNumber,
  );

  // Mantener `phone` (form) sincronizado con selector + número
  React.useEffect(() => {
    const next = composeInternationalPhone(selectedCountry, nationalNumber);
    const current = field.value || "";
    if (current !== next) {
      field.onChange(next);
    }
  }, [nationalNumber, selectedCountry, field]);

  // Sincronizar cuando cambia el valor externo (ej: initialData)
  React.useEffect(() => {
    const parsed = splitPhoneByCountry(field.value || "");
    setSelectedCountry(parsed.country);
    setNationalNumber(parsed.nationalNumber);
  }, [field.value]);

  return (
    <div className="flex gap-2">
      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-[110px] justify-between"
            disabled={disabled}
          >
            <span className="truncate">+{selectedCountry.dialCode}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar país..." />
            <CommandList>
              <CommandEmpty>No se encontró ningún país.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => {
                  const value = `${country.name} +${country.dialCode}`;
                  const isSelected =
                    country.iso2 === selectedCountry.iso2 &&
                    country.dialCode === selectedCountry.dialCode;
                  return (
                    <CommandItem
                      key={`${country.iso2}-${country.dialCode}`}
                      value={value}
                      onSelect={() => {
                        setSelectedCountry(country);
                        setCountryOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <span className="flex-1">{country.name}</span>
                      <span className="text-muted-foreground">
                        +{country.dialCode}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Input
        placeholder="Número (sin código de país)"
        type="tel"
        value={nationalNumber}
        onChange={(e) => {
          const raw = e.target.value;
          const cleaned = normalizePhoneInput(raw);

          // Si pegan un número internacional completo, lo interpretamos
          if (cleaned.trim().startsWith("+")) {
            const parsed = splitPhoneByCountry(cleaned);
            setSelectedCountry(parsed.country);
            setNationalNumber(parsed.nationalNumber);
            return;
          }

          setNationalNumber(cleaned);
        }}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
        disabled={disabled}
        inputMode="tel"
        autoComplete="tel-national"
      />
    </div>
  );
}
