CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`target_id` text,
	`details` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_logs_tenant_idx` ON `activity_logs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `activity_logs_created_idx` ON `activity_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `coach_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text DEFAULT '' NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`speciality` text NOT NULL,
	`city` text,
	`content_style` text,
	`tone` text DEFAULT 'motivant' NOT NULL,
	`bio` text,
	`target_audience` text,
	`language` text DEFAULT 'fr' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coach_profiles_tenant_idx` ON `coach_profiles` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `coach_profiles_user_idx` ON `coach_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `generated_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text DEFAULT '' NOT NULL,
	`network` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`theme` text,
	`content` text NOT NULL,
	`hashtags` text,
	`call_to_action` text,
	`month` text NOT NULL,
	`variant_of_id` text,
	`generated_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `generated_posts_tenant_idx` ON `generated_posts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `generated_posts_status_idx` ON `generated_posts` (`status`);--> statement-breakpoint
CREATE INDEX `generated_posts_tenant_month_idx` ON `generated_posts` (`tenant_id`,`month`);--> statement-breakpoint
CREATE INDEX `generated_posts_tenant_status_date_idx` ON `generated_posts` (`tenant_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `magic_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `magic_tokens_token_idx` ON `magic_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `magic_tokens_email_idx` ON `magic_tokens` (`email`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text DEFAULT '' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`stripe_price_id` text,
	`plan` text DEFAULT 'starter' NOT NULL,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`current_period_end` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `subscriptions_tenant_idx` ON `subscriptions` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`plan` text DEFAULT 'starter' NOT NULL,
	`stripe_customer_id` text,
	`stripe_subscription_id` text,
	`plan_expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tenants_owner_idx` ON `tenants` (`owner_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`email_verified_at` text,
	`consent_given_at` text,
	`onboarding_completed` integer DEFAULT false,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `websites` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text DEFAULT '' NOT NULL,
	`subdomain` text NOT NULL,
	`custom_domain` text,
	`template` text DEFAULT 'aura' NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`theme_color` text DEFAULT '#7c3aed',
	`headline` text,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `websites_subdomain_unique` ON `websites` (`subdomain`);--> statement-breakpoint
CREATE INDEX `websites_tenant_idx` ON `websites` (`tenant_id`);