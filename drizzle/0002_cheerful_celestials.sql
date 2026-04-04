CREATE TABLE `securityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('login_success','login_failed','login_brute_force','scan_created','scan_suspicious','admin_access','admin_user_modified','payment_attempted','payment_failed','webhook_received','webhook_failed','rate_limit_exceeded','unauthorized_access','data_export','suspicious_ip') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`ipAddress` varchar(45),
	`userAgent` text,
	`email` varchar(320),
	`description` text NOT NULL,
	`metadata` json,
	`isAnomalous` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityLogs_id` PRIMARY KEY(`id`)
);
