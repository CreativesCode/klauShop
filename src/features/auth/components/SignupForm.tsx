"use client";

import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useToast } from "@/components/ui/use-toast";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { getAuthErrorMessage, signupSchema } from "../validations";
import { PasswordInput } from "./PasswordInput";

type FormData = z.infer<typeof signupSchema>;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = React.useState(false);
  // Before hydration a submit would be a native GET with the password in the URL
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: searchParams.get("name") || "",
      email: searchParams.get("email") || "",
      password: "",
    },
  });

  async function onSubmit({ email, password, name }: FormData) {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "No se pudo crear la cuenta",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      return;
    }

    // With email confirmation on, an existing email returns a user without identities
    if (data.user && data.user.identities?.length === 0) {
      toast({
        title: "No se pudo crear la cuenta",
        description:
          "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.",
        variant: "destructive",
      });
      return;
    }

    if (!data.session) {
      toast({
        title: "Revisa tu correo",
        description:
          "Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.",
      });
      return;
    }

    router.push(
      getSafeRedirect(
        searchParams?.get("redirect") ?? searchParams?.get("from"),
      ) ?? "/",
    );
  }

  return (
    <Form {...form}>
      <form
        method="post"
        className="grid gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="¿Cómo deberíamos llamarte?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input placeholder="tu@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput placeholder="Ingresa tu contraseña" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={!ready || isLoading}>
          {isLoading && (
            <Icons.spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Continuar
          <span className="sr-only">
            Continuar a la página de verificación de correo electrónico
          </span>
        </Button>
      </form>
    </Form>
  );
}

export default SignUpForm;
