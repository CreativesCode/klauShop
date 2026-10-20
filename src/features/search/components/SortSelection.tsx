import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

type Selection = { value: string; label: string };

type SelectionFilterProps = React.ComponentProps<typeof Select> & {
  id: string;
  selectionLabel?: string;
  items: Selection[];
  placeholder?: string;
  className?: string;
};

function SortSelection({
  items,
  selectionLabel = "",
  placeholder = "",
  className = "",
  ...props
}: SelectionFilterProps) {
  return (
    <Select {...props}>
      <SelectTrigger className="h-10 min-w-[140px] max-w-[220px] rounded-full border-neutral-200 px-4 font-bold">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectLabel>{selectionLabel}</SelectLabel>
          {items.map((item, index) => (
            <SelectItem key={index} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SortSelection;
