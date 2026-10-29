CREATE TABLE `nav_schools` (
	`school` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL UNIQUE,
	`approved` integer DEFAULT 0 NOT NULL,
	`disabled` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_accounts` (
	`school` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL UNIQUE,
	`salt` text NOT NULL,
	`hash` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_invites` (
	`token` text PRIMARY KEY NOT NULL,
	`school` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`expires` integer NOT NULL,
	`created` integer NOT NULL,
	`used` integer
);
--> statement-breakpoint
CREATE TABLE `nav_partners` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated` integer NOT NULL
);
