import "server-only";

import { env } from "@/env.mjs";
import { cacheExchange, createClient, fetchExchange } from "@urql/core";
import { registerUrql } from "@urql/next/rsc";

/**
 * Server-only URQL client authenticated with Supabase Service Role key.
 * Use ONLY from server components / route handlers.
 */
export const makeServiceClient = (access_token?: string) => {
  return createClient({
    url: `https://${env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co/graphql/v1`,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      const headers: Record<string, string> = {
        apiKey: env.DATABASE_SERVICE_ROLE,
      };

      // The gateway takes the role from Authorization: with only apiKey the request ran as
      // anon, which stopped seeing orders/profiles once RLS was locked down (0018).
      headers["Authorization"] =
        `Bearer ${access_token ?? env.DATABASE_SERVICE_ROLE}`;

      return { headers };
    },
  });
};

export const { getClient: getServiceClient } = registerUrql(makeServiceClient);
