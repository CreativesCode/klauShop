"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import supabaseClient from "@/lib/supabase/client";
import { getNameInitials } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import * as React from "react";

export function ProfileClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  const [name, setName] = React.useState(
    (user?.user_metadata?.name as string | undefined) ?? "",
  );
  const [avatarUrl, setAvatarUrl] = React.useState(
    (user?.user_metadata?.avatar_url as string | undefined) ?? "",
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null,
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName((user?.user_metadata?.name as string | undefined) ?? "");
    setAvatarUrl((user?.user_metadata?.avatar_url as string | undefined) ?? "");
  }, [user?.id]);

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // reset input so selecting the same file again still triggers onChange
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Selecciona una imagen (png/jpg/webp).",
        variant: "destructive",
      });
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      toast({
        title: "Imagen muy grande",
        description: "Máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(URL.createObjectURL(file));

    try {
      setIsUploadingAvatar(true);

      // Usar el endpoint de API que usa service role para bypassar RLS
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "No se pudo subir la imagen.",
          variant: "destructive",
        });
        return;
      }

      // Actualizar el estado local con la nueva URL
      setAvatarUrl(data.avatarUrl);

      // Actualizar el usuario en el cliente para reflejar los cambios
      await supabaseClient.auth.refreshSession();

      toast({
        title: "Avatar actualizado",
        description: "Se subió tu foto y se guardó en tu perfil.",
      });
      router.refresh();
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      const { error } = await supabaseClient.auth.updateUser({
        data: {
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
        },
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
        title: "Perfil actualizado",
        description: "Tus cambios se guardaron correctamente.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayName =
    name || (user?.user_metadata?.name as string | undefined) || "Usuario";
  const resolvedAvatar =
    avatarUrl || (user?.user_metadata?.avatar_url as string | undefined) || "";
  const resolvedAvatarForPreview = avatarPreviewUrl || resolvedAvatar;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Actualiza tu nombre y tu foto de perfil.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
          <CardDescription>
            Esto se muestra en la navegación y en tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={resolvedAvatarForPreview || undefined}
                      alt={getNameInitials(displayName)}
                    />
                    <AvatarFallback className="text-lg">
                      {getNameInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{displayName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Subir foto</TabsTrigger>
                  <TabsTrigger value="url">Usar URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!user || isUploadingAvatar}
                      onChange={onAvatarFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!user || isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploadingAvatar ? "Subiendo..." : "Seleccionar foto"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG o WebP. Máximo 2MB.
                  </p>
                </TabsContent>
                <TabsContent value="url" className="space-y-3 mt-4">
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://ejemplo.com/mi-avatar.jpg"
                    autoComplete="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ingresa la URL completa de una imagen. Si dejas vacío, se
                    usará el avatar por defecto.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                disabled={!user || isSaving || isUploadingAvatar}
                type="submit"
              >
                Guardar cambios
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!user || isSaving || isUploadingAvatar}
                onClick={() => {
                  setName(
                    (user?.user_metadata?.name as string | undefined) ?? "",
                  );
                  setAvatarUrl(
                    (user?.user_metadata?.avatar_url as string | undefined) ??
                      "",
                  );
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
