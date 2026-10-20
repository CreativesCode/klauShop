"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/features/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { createUser } from "../actions";
import { AdminUserFormData, adminUserShcema } from "../validations";

function AdminUserForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserShcema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createUser(values);
        toast({
          title: "Usuario creado",
          description: `${values.name} ya puede iniciar sesión.`,
        });
        router.push("/admin/users");
        router.refresh();
      } catch (err) {
        toast({
          title: "No se pudo crear el usuario",
          description:
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          variant: "destructive",
        });
      }
    });
  });

  return (
    <Form {...form}>
      <form
        id="project-form"
        className="flex flex-col gap-[18px]"
        onSubmit={onSubmit}
      >
        <section className="flex max-w-xl flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre*</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del usuario" {...field} />
                </FormControl>
                <FormDescription>
                  Se muestra cuando el usuario inicia sesión.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email*</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="off"
                    placeholder="correo@ejemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  El usuario entra a su cuenta con este correo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña*</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Contraseña"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Mínimo 6 caracteres.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="flex max-w-xl items-center justify-between gap-3">
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
          <Button disabled={isPending} form="project-form" type="submit">
            {isPending && (
              <Spinner className="size-4 animate-spin" aria-hidden="true" />
            )}
            Crear usuario
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AdminUserForm;
