import "server-only";

import db from "@/lib/supabase/db";
import { profiles } from "@/lib/supabase/schema";
import { User } from "@supabase/supabase-js";

// orders.user_id and address.userProfileId reference profiles. Profiles are created by the
// auth.users trigger (drizzle/0020); this is the safety net for users created before it.
export async function ensureProfile(
  executor: Pick<typeof db, "insert">,
  user: User,
) {
  await executor
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email ?? null,
      name: (user.user_metadata?.name as string | undefined) ?? null,
    })
    // Any conflict (id, or a legacy row with the same unique email) means nothing to do
    .onConflictDoNothing();
}
