"use client";

import { relayPagination } from "@urql/exchange-graphcache/extras";
import {
  UrqlProvider,
  createClient,
  fetchExchange,
  ssrExchange,
} from "@urql/next";

import { cacheExchange } from "@urql/exchange-graphcache";
import { retryExchange } from "@urql/exchange-retry";
import { useMemo } from "react";
import { env } from "../env.mjs";
import { useAuth } from "./AuthProvider";

export default function Provider({ children }: React.PropsWithChildren) {
  const { session } = useAuth();

  const [client, ssr] = useMemo(() => {
    const ssr = ssrExchange();

    const client = createClient({
      url: `https://${env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co/graphql/v1`,
      exchanges: [
        // devtoolsExchange,
        cacheExchange({
          resolvers: {
            Query: {
              mediasCollection: relayPagination(),
            },
          },

          keys: {
            carts: (data) => `${data.product_id}`,
          },
        }),
        ssr,
        // Cuban mobile networks drop requests: retry network errors only (never GraphQL errors)
        retryExchange({
          initialDelayMs: 1000,
          maxDelayMs: 8000,
          maxNumberAttempts: 3,
          retryIf: (error) => !!error?.networkError,
        }),
        fetchExchange,
      ],
      fetchOptions: () => {
        const headers = {
          apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        };

        if (session) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        return { headers };
      },
      suspense: true,
    });

    return [client, ssr];
  }, [session]);

  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  );
}
