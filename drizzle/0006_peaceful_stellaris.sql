ALTER TABLE `users` ADD `oneTimeScanUsed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `oneTimeScanPurchasedAt` timestamp;