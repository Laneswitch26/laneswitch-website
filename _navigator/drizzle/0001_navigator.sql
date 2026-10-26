CREATE TABLE `nav_documents` (
	`school` text PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`listed` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_files` (
	`id` text PRIMARY KEY NOT NULL,
	`school` text NOT NULL,
	`name` text NOT NULL,
	`bytes` blob NOT NULL,
	`size` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`school` text NOT NULL,
	`csrf` text NOT NULL,
	`expires` integer NOT NULL,
	`account_version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nav_throttle` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`until` integer NOT NULL
);
