ALTER TABLE "address" ALTER COLUMN "userProfileId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "recipient_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "zone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "full_address" text;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;