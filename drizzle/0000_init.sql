CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "chat_messages_repo_idx" ON "chat_messages" USING btree ("owner","repo","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_scope_owner_repo_idx" ON "notes" USING btree ("scope","owner","repo");--> statement-breakpoint
CREATE INDEX "notes_scope_idx" ON "notes" USING btree ("scope");