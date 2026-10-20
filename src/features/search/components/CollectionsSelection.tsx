import { Icons } from "@/components/layouts/icons";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTriggerProps } from "@radix-ui/react-dropdown-menu";

interface CollectionsSelectionProps extends DropdownMenuTriggerProps {
  selections: { id: string; label: string }[];
  value: string[];
  onCheckedChange: (id: string) => void;
}

function CollectionsSelection({
  selections,
  value,
  onCheckedChange,
  ...props
}: CollectionsSelectionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger {...props}>
        Categorías
        <Icons.chevronDown className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Categorías</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {selections.map((collection) => (
          <DropdownMenuCheckboxItem
            key={collection.id}
            checked={(value || []).includes(collection.id)}
            onCheckedChange={() => onCheckedChange(collection.id)}
          >
            {collection.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CollectionsSelection;
