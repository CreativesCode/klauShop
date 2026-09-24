"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { updateAdminPhone } from "@/features/users";
import supabaseClient from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import * as React from "react";

type AccountClientProps = {
  isAdmin?: boolean;
  adminPhone?: string;
};

export function AccountClient({
  isAdmin = false,
  adminPhone = "",
}: AccountClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isSavingPhone, setIsSavingPhone] = React.useState(false);
  const [phone, setPhone] = React.useState(adminPhone);

  const [email, setEmail] = React.useState(user?.email ?? "");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.id]);

  const onChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nextEmail = email.trim();
    if (!nextEmail) {
      toast({ title: "Email requerido", variant: "destructive" });
      return;
    }

    try {
      setIsChangingEmail(true);
      const { error } = await supabaseClient.auth.updateUser({
        email: nextEmail,
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Revisa tu correo",
        description: "Te enviamos un email para confirmar el cambio de correo.",
      });
      router.refresh();
    } finally {
      setIsChangingEmail(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validación de longitud mínima
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Contraseña inválida",
        description: "La contraseña debe tener al menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validación de longitud máxima
    if (newPassword.length > 100) {
      toast({
        title: "Contraseña inválida",
        description: "La contraseña no puede tener más de 100 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Validación de complejidad: al menos una minúscula, una mayúscula, un número y un carácter especial
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "Contraseña inválida",
        description:
          "La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "No coincide",
        description: "La confirmación no coincide con la contraseña.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente.",
      });
      router.refresh();
    } finally {
      setIsChangingPassword(false);
    }
  };

  const onSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingPhone(true);
      await updateAdminPhone({ phone });
      toast({
        title: "Teléfono guardado",
        description: phone.trim()
          ? "Recibirás los pedidos nuevos por WhatsApp."
          : "Ya no recibirás avisos de pedidos por WhatsApp.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo guardar.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const onSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabaseClient.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Cuenta</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona tu correo, contraseña y sesión.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Correo</CardTitle>
          <CardDescription>
            Cambiar tu correo normalmente requiere confirmación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onChangeEmail}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            <Button disabled={!user || isChangingEmail} type="submit">
              Guardar email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onChangePassword}>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                autoComplete="new-password"
              />
            </div>
            <Button disabled={!user || isChangingPassword} type="submit">
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Avisos de pedidos por WhatsApp</CardTitle>
            <CardDescription>
              Recibe un mensaje automático cada vez que entra un pedido nuevo.
              Déjalo vacío para no recibir avisos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSavePhone}>
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Teléfono de WhatsApp</Label>
                <Input
                  id="adminPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+53 5xxxxxxx"
                  autoComplete="tel"
                />
              </div>
              <Button disabled={isSavingPhone} type="submit">
                Guardar teléfono
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sesión</CardTitle>
          <CardDescription>Acciones rápidas de seguridad.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            disabled={!user || isSigningOut}
            variant="destructive"
            onClick={onSignOut}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
