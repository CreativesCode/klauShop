import { User } from "@supabase/supabase-js";

// Pure helper: must NOT live in a "use server" module (exports there become async actions,
// so a sync check would return a Promise and always be truthy).
export const isAdmin = (currentUser: User | null) =>
  currentUser?.app_metadata?.isAdmin === true;
