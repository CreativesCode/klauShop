"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/features/auth";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { updateUserAction } from "../actions";
import { AdminUserUpdateData, adminUserUpdateSchema } from "../validations";
import { DeleteUserDialog } from "./admin/DeleteUserDialog";

type UpdateUserFormProps = {
  user: User;
};

function UpdateUserForm({ user }: UpdateUserFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AdminUserUpdateData>({
    resolver: zodResolver(adminUserUpdateSchema),
    defaultValues: {
      name: (user.user_metadata?.name as string | undefined) ?? "",
      email: user.email ?? "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateUserAction(user.id, values);
        toast({ title: "Usuario actualizado" });
        router.push("/admin/users");
        router.refresh();
      } catch (err) {
        toast({
          title: "No se pudo guardar",
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
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Déjala vacía para no cambiarla"
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
          <div className="flex items-center gap-2">
            <DeleteUserDialog
              userId={user.id}
              userName={user.user_metadata?.name || user.email || "Usuario"}
            />
            <Button disabled={isPending} form="project-form" type="submit">
              {isPending && (
                <Spinner className="size-4 animate-spin" aria-hidden="true" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default UpdateUserForm;
