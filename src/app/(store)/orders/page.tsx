import { signInRedirect } from "@/lib/safeRedirect";
import { Shell } from "@/components/layouts/Shell";
import { BuyAgainCard, OrdersList } from "@/features/orders/components";
import { BuyAgainCardFragment } from "@/features/orders/components/BuyAgainCard";
import { OrdersListFragment } from "@/features/orders/components/OrdersList";
import { gql } from "@/gql";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/urql-service";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RefreshOnFocus } from "@/features/orders/components/RefreshOnFocus";

// Import fragments to ensure they're available for gql.tada
// Reference them to ensure gql.tada includes them in the query
void BuyAgainCardFragment;
void OrdersListFragment;

const OrderPageQuery = gql(/* GraphQL */ `
  query OrderPageQuery($first: Int!, $userId: UUID, $after: Cursor) {
    ordersCollection(
      first: $first
      after: $after
      orderBy: [{ created_at: DescNullsLast }]
      filter: { user_id: { eq: $userId } }
    ) {
      __typename
      edges {
        ...OrdersListFragment
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }

    productsCollection(first: 8, filter: { stock: { gt: 0 } }) {
      edges {
        ...BuyAgainCardFragment
      }
    }
  }
`);

interface OrderPageProps {
  searchParams: {
    after?: string;
  };
}

async function OrderPage({ searchParams }: OrderPageProps) {
  const cookieStore = cookies();
  const supabase = createClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(signInRedirect("/orders"));
  }

  const queryVars: {
    first: number;
    userId: string;
    after?: string | null;
  } = {
    first: 5,
    userId: user.id,
  };

  if (searchParams.after) {
    queryVars.after = searchParams.after;
  }

  const { data } = await getServiceClient().query(
    OrderPageQuery,
    queryVars as any,
  );

  if (!data) return notFound();

  return (
    <Shell>
      <RefreshOnFocus />
      <h1 className="text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-ink">
        Mis órdenes
      </h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <OrdersList
            orders={data.ordersCollection.edges}
            pageInfo={data.ordersCollection.pageInfo}
          />
        </section>

        <section className="min-w-0">
          <BuyAgainCard products={data.productsCollection.edges} />
        </section>
      </div>
    </Shell>
  );
}

export default OrderPage;
