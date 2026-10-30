CREATE TABLE `nav_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
