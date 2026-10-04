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

    productsCollection(first: 8) {
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
    redirect("/sign-in");
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
    <Shell layout="narrow" className="max-w-screen-2xl mx-auto">
      <RefreshOnFocus />
      <h1 className="pb-8 text-3xl font-semibold border-b">Órdenes</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <section className="col-span-1 md:col-span-9">
          <OrdersList
            orders={data.ordersCollection.edges}
            pageInfo={data.ordersCollection.pageInfo}
          />
        </section>

        <section className="col-span-1 md:col-span-3">
          <BuyAgainCard products={data.productsCollection.edges} />
        </section>
      </div>
    </Shell>
  );
}

export default OrderPage;
