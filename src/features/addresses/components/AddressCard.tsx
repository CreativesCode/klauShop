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
    <Card className={address.isDefault ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {address.name}
              {address.isDefault && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Predeterminada
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground">
              {address.recipientName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <span>{address.phone}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">{address.zone}</p>
            {address.fullAddress && (
              <p className="text-muted-foreground">{address.fullAddress}</p>
            )}
          </div>
        </div>
        {address.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Notas:</span> {address.notes}
            </p>
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {!address.isDefault && onSetDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(address.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Star className="h-4 w-4 mr-2" />
              Predeterminada
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(address)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
