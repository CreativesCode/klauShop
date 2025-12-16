"use client";

import Branding from "@/components/layouts/Branding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import supabaseClient from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(false);
  const [mode, setMode] = React.useState<"request" | "update">("request");

  // Request mode
  const [email, setEmail] = React.useState("");

  // Update mode
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) setMode("update");
    });
  }, []);

  const onRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextEmail = email.trim();
    if (!nextEmail) {
      toast({ title: "Email requerido", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      // Supabase recommends landing on a callback route that exchanges `?code=...`
      // for a session, then we redirect into the reset-password UI.
      const redirectTo = `${window.location.origin}/auth/callback?next=/sign-in/reset-password`;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        nextEmail,
        {
          redirectTo,
        },
      );

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
        description: "Te enviamos un enlace para restablecer tu contraseña.",
      });
      setEmail("");
    } finally {
      setIsLoading(false);
    }
  };

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: "Contraseña inválida",
        description: "Usa al menos 8 caracteres.",
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
      setIsLoading(true);
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
      toast({
        title: "Contraseña actualizada",
        description: "Ya puedes iniciar sesión.",
      });
      setNewPassword("");
      setConfirmPassword("");
      await supabaseClient.auth.signOut();
      router.push("/sign-in");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md px-3 sm:px-0">
      <Card className="border-0 border-t-4 border-accent">
        <CardHeader className="space-y-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Branding className="mb-2" />
            <h1 className="text-2xl font-bold text-primary">
              {mode === "request"
                ? "Recuperar contraseña"
                : "Crear nueva contraseña"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "request"
                ? "Te enviamos un enlace para restablecerla."
                : "Define una nueva contraseña para tu cuenta."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {mode === "request" ? (
            <form className="grid gap-4" onSubmit={onRequestReset}>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>
              <Button
                disabled={isLoading}
                className="w-full rounded-full"
                type="submit"
              >
                Enviar enlace
              </Button>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={onUpdatePassword}>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button
                disabled={isLoading}
                className="w-full rounded-full"
                type="submit"
              >
                Guardar contraseña
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          {mode === "update" && (
            <Button
              variant="outline"
              className="w-full rounded-full"
              disabled={isLoading}
              onClick={() => setMode("request")}
            >
              Volver a enviar enlace
            </Button>
          )}
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
