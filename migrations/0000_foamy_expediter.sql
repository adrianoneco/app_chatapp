CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol" text NOT NULL,
	"client_id" varchar,
	"client_name" text NOT NULL,
	"client_email" text,
	"client_phone" text,
	"attendant_id" varchar,
	"channel" text DEFAULT 'web' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"subject" text,
	"latitude" text,
	"longitude" text,
	"city" text,
	"state" text,
	"country" text,
	"last_message_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "conversations_protocol_unique" UNIQUE("protocol")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar,
	"sender_type" text DEFAULT 'client' NOT NULL,
	"sender_name" text NOT NULL,
	"content" text NOT NULL,
	"content_type" text DEFAULT 'text' NOT NULL,
	"file_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"celular" text,
	"external_id" text,
	"role" text DEFAULT 'client' NOT NULL,
	"avatar" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_active" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"main_sidebar_collapsed" boolean DEFAULT false,
	"conversations_sidebar_width" integer DEFAULT 320,
	"conversations_sidebar_collapsed" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_attendant_id_users_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_external_id" ON "users" USING btree ("external_id") WHERE "users"."external_id" IS NOT NULL AND "users"."external_id" != '';