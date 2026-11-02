CREATE TABLE `nav_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`school` text NOT NULL,
	`title` text NOT NULL,
	`topic` text,
	`format` text,
	`caption` text NOT NULL,
	`image` text,
	`task` text,
	`provider` text,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `nav_posts_school` ON `nav_posts` (`school`,`created`);
--> statement-breakpoint
CREATE TABLE `nav_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`school` text NOT NULL,
	`rating` integer NOT NULL,
	`text` text,
	`provider` text,
	`created` integer NOT NULL
);
