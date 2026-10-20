"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SelectAddress } from "@/lib/supabase/schema";
import { MapPin, Phone, Star, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AddressCardProps = {
  address: SelectAddress;
  onEdit?: (address: SelectAddress) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
};

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isLoading = false,
  showActions = true,
}: AddressCardProps) {
  return (
    <Card
      className={
        address.isDefault ? "border-primary ring-1 ring-inset ring-primary" : ""
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {address.name}
              {address.isDefault && (
                <Badge variant="default" className="gap-1">
                  <Star className="size-3 fill-current" aria-hidden />
                  Predeterminada
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm font-semibold text-neutral-600">
              {address.recipientName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <Phone className="mt-0.5 size-4 text-neutral-400" aria-hidden />
          <span>{address.phone}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 size-4 text-neutral-400" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-ink">{address.zone}</p>
            {address.fullAddress && (
              <p className="text-neutral-600">{address.fullAddress}</p>
            )}
          </div>
        </div>
        {address.notes && (
          <div className="rounded-xl bg-cream px-3.5 py-2.5">
            <p className="text-sm text-neutral-600">
              <span className="font-bold text-ink">Notas:</span> {address.notes}
            </p>
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {!address.isDefault && onSetDefault && (
            <Button
              variant="outline"
              onClick={() => onSetDefault(address.id)}
              disabled={isLoading}
              className="h-10 flex-1 rounded-full"
            >
              <Star className="size-4" aria-hidden />
              Predeterminada
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(address)}
              disabled={isLoading}
              className="size-10"
              aria-label="Editar dirección"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructiveSoft"
                  size="icon"
                  disabled={isLoading}
                  className="size-10"
                  aria-label="Eliminar dirección"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La dirección &quot;
                    {address.name}&quot; será eliminada permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(address.id)}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default AddressCard;
