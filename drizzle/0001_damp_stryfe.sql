CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scanId` int,
	`stripePaymentIntentId` varchar(255),
	`stripeSessionId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'eur',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL,
	`description` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(2048) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`currentStep` varchar(255),
	`securityScore` int,
	`riskLevel` enum('low','medium','high','critical'),
	`totalVulnerabilities` int NOT NULL DEFAULT 0,
	`criticalCount` int NOT NULL DEFAULT 0,
	`highCount` int NOT NULL DEFAULT 0,
	`mediumCount` int NOT NULL DEFAULT 0,
	`lowCount` int NOT NULL DEFAULT 0,
	`isPaid` boolean NOT NULL DEFAULT false,
	`paymentIntentId` varchar(255),
	`reportPdfUrl` varchar(2048),
	`reportPdfKey` varchar(1024),
	`scanDuration` int,
	`errorMessage` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('basic','professional','enterprise') NOT NULL,
	`status` enum('active','inactive','cancelled','past_due') NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`stripeCustomerId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`amount` decimal(10,2),
	`currency` varchar(3) DEFAULT 'eur',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text NOT NULL,
	`detectionMethod` text,
	`impact` text,
	`technicalDetails` text,
	`remediation` text,
	`owaspReference` varchar(255),
	`cvssScore` decimal(4,1),
	`evidence` text,
	`aiExplanationBasic` text,
	`aiExplanationTechnical` text,
	`aiExplanationExpert` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vulnerabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('free','basic','professional','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','inactive','cancelled','past_due') DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `scansUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `scansLimit` int DEFAULT 1 NOT NULL;