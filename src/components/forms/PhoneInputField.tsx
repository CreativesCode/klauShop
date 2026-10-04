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
import {
  COUNTRIES,
  composeInternationalPhone,
  type CountryOption,
  normalizePhoneInput,
  splitPhoneByCountry,
} from "@/lib/phone";
import { Check, ChevronsUpDown } from "lucide-react";

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
  const [countryOpen, setCountryOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<CountryOption>(
    () => splitPhoneByCountry(field.value || "").country,
  );
  const [nationalNumber, setNationalNumber] = React.useState(
    () => splitPhoneByCountry(field.value || "").nationalNumber,
  );
  // Last value sent to the form: lets us tell our own updates from external ones
  const lastEmitted = React.useRef(field.value || "");

  const emit = (country: CountryOption, national: string) => {
    setSelectedCountry(country);
    setNationalNumber(national);
    const next = composeInternationalPhone(country, national);
    lastEmitted.current = next;
    field.onChange(next);
  };

  // Re-seed only when the value changes from outside (e.g. initialData, reset)
  React.useEffect(() => {
    const value = field.value || "";
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    const parsed = splitPhoneByCountry(value);
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
                        emit(country, nationalNumber);
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

          // Si pegan o teclean un número internacional, lo interpretamos
          if (cleaned.trim().startsWith("+")) {
            const parsed = splitPhoneByCountry(cleaned);
            if (!parsed.matched) {
              // Still typing the dial code ("+5"): keep the partial "+"
              setNationalNumber(cleaned.trim());
              return;
            }
            emit(parsed.country, parsed.nationalNumber);
            return;
          }

          emit(selectedCountry, cleaned);
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
