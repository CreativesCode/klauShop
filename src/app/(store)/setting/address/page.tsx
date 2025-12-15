import db from "@/lib/supabase/db";
import { address } from "@/lib/supabase/schema";
import { createClient } from "@/lib/supabase/server";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AddressManagementClient } from "./AddressManagementClient";

async function AddressPage() {
  const cookieStore = cookies();
  const supabase = createClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  // Obtener direcciones del usuario
  const addresses = await db
    .select()
    .from(address)
    .where(eq(address.userProfileId, user.id))
    .orderBy(desc(address.isDefault), desc(address.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Direcciones de entrega</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona tus direcciones de entrega para agilizar tus pedidos
        </p>
      </div>
      <AddressManagementClient initialAddresses={addresses} />
    </div>
  );
}

export default AddressPage;
