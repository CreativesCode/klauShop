-- Increase GraphQL max_rows limit for products table
-- This allows fetching more than 30 products via GraphQL queries
COMMENT ON TABLE "products" IS e'@graphql({"max_rows": 1000})';

