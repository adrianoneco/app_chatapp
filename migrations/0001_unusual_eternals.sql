ALTER TABLE "messages" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "quoted_message_id" varchar;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_forwarded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_private" boolean DEFAULT false;