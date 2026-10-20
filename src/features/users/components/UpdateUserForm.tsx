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
import { AdminUserFormData, adminUserShcema } from "../validations";
import { DeleteUserDialog } from "./admin/DeleteUserDialog";

type AdminUserFormProps = {
  user?: User;
};

function UpdateUserForm({ user }: AdminUserFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserShcema),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = handleSubmit(
    async ({ name, email, password }: AdminUserFormData) => {
      //   startTransition(async () => {
      //     try {
      //       await createUser({ email, password, name })
      //       router.push("/admin/users")
      //       toast({
      //         title: "Created a new user.",
      //         description: `${name} is created.`,
      //       })
      //     } catch (err) {
      //       toast({
      //         title: "Error",
      //         description: `${err.message}`,
      //       })
      //     }
      //   })
    },
  );

  return (
    <Form {...form}>
      <form
        id="project-form"
        className="flex flex-col gap-[18px]"
        onSubmit={onSubmit}
      >
        <section className="flex max-w-xl flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
          {/* <FormItem>
            <FormLabel className="text-sm">Nombre*</FormLabel>
            <FormControl>
              <Input
                defaultValue={user?.name || ""}
                aria-invalid={!!form.formState.errors.name}
                placeholder="Nombre del usuario"
                {...register("name")}
              />
            </FormControl>
            <FormDescription>
              Se muestra cuando el usuario inicia sesión.
            </FormDescription>
            <FormMessage />
          </FormItem> */}

          <FormItem>
            <FormLabel className="text-sm">Email*</FormLabel>
            <FormControl>
              <Input
                defaultValue={user?.email || ""}
                aria-invalid={!!form.formState.errors.email}
                placeholder="correo@ejemplo.com"
                {...register("email")}
              />
            </FormControl>
            <FormDescription>
              El usuario entra a su cuenta con este correo.
            </FormDescription>
            <FormMessage />
          </FormItem>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel>Contraseña*</FormLabel>
                <FormControl>
                  <PasswordInput
                    aria-invalid={!!form.formState.errors}
                    placeholder="Contraseña"
                    {...field}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormDescription>
                    Crea una contraseña para esta cuenta.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </section>

        <div className="flex max-w-xl items-center justify-between gap-3">
          <div className="flex gap-x-5 items-center">
            <Link
              href="/admin/users"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancelar
            </Link>
          </div>
          <div className="flex gap-x-5 items-center">
            {user && (
              <DeleteUserDialog
                userId={user.id}
                userName={user.user_metadata?.name || user.email || "Usuario"}
              />
            )}
            <Button disabled={isPending} form="project-form" type="submit">
              {user ? "Guardar cambios" : "Crear usuario"}
              {isPending && (
                <Spinner className="size-4 animate-spin" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default UpdateUserForm;
