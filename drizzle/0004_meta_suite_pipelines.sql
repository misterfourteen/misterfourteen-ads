-- Meta Suite: cache de datos de Meta Graph API por cuenta publicitaria
CREATE TABLE `metaCampaignCache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `metaConnectionId` int NOT NULL,
  `metaCampaignId` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(64) NOT NULL,
  `objective` varchar(128),
  `dailyBudget` decimal(12,2),
  `lifetimeBudget` decimal(12,2),
  `startTime` timestamp,
  `stopTime` timestamp,
  `impressions` bigint DEFAULT 0,
  `clicks` bigint DEFAULT 0,
  `spend` decimal(12,2) DEFAULT '0',
  `reach` bigint DEFAULT 0,
  `ctr` decimal(8,4) DEFAULT '0',
  `cpc` decimal(10,4) DEFAULT '0',
  `cpm` decimal(10,4) DEFAULT '0',
  `conversions` int DEFAULT 0,
  `costPerConversion` decimal(10,4) DEFAULT '0',
  `roas` decimal(10,4) DEFAULT '0',
  `frequency` decimal(8,4) DEFAULT '0',
  `rawData` json,
  `lastSyncAt` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `metaCampaignCache_id` PRIMARY KEY(`id`),
  UNIQUE KEY `metaCampaignCache_user_campaign` (`userId`, `metaCampaignId`)
);

-- Ad sets cache
CREATE TABLE `metaAdSetCache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `metaCampaignId` varchar(128) NOT NULL,
  `metaAdSetId` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(64) NOT NULL,
  `dailyBudget` decimal(12,2),
  `targeting` json,
  `impressions` bigint DEFAULT 0,
  `clicks` bigint DEFAULT 0,
  `spend` decimal(12,2) DEFAULT '0',
  `ctr` decimal(8,4) DEFAULT '0',
  `cpc` decimal(10,4) DEFAULT '0',
  `rawData` json,
  `lastSyncAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `metaAdSetCache_id` PRIMARY KEY(`id`),
  UNIQUE KEY `metaAdSetCache_user_adset` (`userId`, `metaAdSetId`)
);

-- Individual ads cache
CREATE TABLE `metaAdCache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `metaCampaignId` varchar(128) NOT NULL,
  `metaAdSetId` varchar(128) NOT NULL,
  `metaAdId` varchar(128) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(64) NOT NULL,
  `previewUrl` varchar(1024),
  `thumbnailUrl` varchar(512),
  `headline` varchar(255),
  `body` text,
  `callToAction` varchar(64),
  `impressions` bigint DEFAULT 0,
  `clicks` bigint DEFAULT 0,
  `spend` decimal(12,2) DEFAULT '0',
  `ctr` decimal(8,4) DEFAULT '0',
  `cpc` decimal(10,4) DEFAULT '0',
  `relevanceScore` decimal(5,2),
  `rawData` json,
  `lastSyncAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `metaAdCache_id` PRIMARY KEY(`id`),
  UNIQUE KEY `metaAdCache_user_ad` (`userId`, `metaAdId`)
);

-- Instagram/Facebook posts cache
CREATE TABLE `metaPostCache` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `metaPageId` varchar(128) NOT NULL,
  `metaPostId` varchar(128) NOT NULL,
  `platform` enum('facebook','instagram') NOT NULL,
  `message` text,
  `mediaUrl` varchar(1024),
  `thumbnailUrl` varchar(512),
  `postType` varchar(64),
  `permalink` varchar(1024),
  `likes` int DEFAULT 0,
  `comments` int DEFAULT 0,
  `shares` int DEFAULT 0,
  `reach` int DEFAULT 0,
  `impressions` int DEFAULT 0,
  `saves` int DEFAULT 0,
  `publishedAt` timestamp,
  `rawData` json,
  `lastSyncAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `metaPostCache_id` PRIMARY KEY(`id`),
  UNIQUE KEY `metaPostCache_user_post` (`userId`, `metaPostId`)
);

-- Meta webhook events log
CREATE TABLE `metaWebhookEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `eventType` varchar(128) NOT NULL,
  `objectId` varchar(128),
  `payload` json,
  `processed` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `metaWebhookEvents_id` PRIMARY KEY(`id`)
);

-- CRM Pipeline stages
CREATE TABLE `pipelineStages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `color` varchar(7) DEFAULT '#6366f1',
  `position` int NOT NULL DEFAULT 0,
  `isDefault` boolean NOT NULL DEFAULT false,
  `automations` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `pipelineStages_id` PRIMARY KEY(`id`)
);

-- CRM Leads
CREATE TABLE `leads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `stageId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320),
  `phone` varchar(64),
  `source` enum('meta_lead_ad','landing_page','manual','whatsapp','email','other') DEFAULT 'manual',
  `metaLeadId` varchar(128),
  `metaAdId` varchar(128),
  `metaCampaignId` varchar(128),
  `metaFormId` varchar(128),
  `notes` text,
  `tags` json,
  `customFields` json,
  `assignedTo` int,
  `value` decimal(10,2),
  `probability` int DEFAULT 0,
  `lastContactedAt` timestamp,
  `closedAt` timestamp,
  `position` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);

-- Lead activity log
CREATE TABLE `leadActivities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `leadId` int NOT NULL,
  `userId` int NOT NULL,
  `type` enum('note','email','call','whatsapp','stage_change','task','meeting') NOT NULL,
  `content` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `leadActivities_id` PRIMARY KEY(`id`)
);

-- Pipeline automations (triggers)
CREATE TABLE `pipelineAutomations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `isActive` boolean NOT NULL DEFAULT true,
  `trigger` json NOT NULL,
  `actions` json NOT NULL,
  `executionCount` int DEFAULT 0,
  `lastExecutedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `pipelineAutomations_id` PRIMARY KEY(`id`)
);

-- Landing pages
CREATE TABLE `landingPages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `brandBrainId` int,
  `name` varchar(255) NOT NULL,
  `slug` varchar(128) NOT NULL,
  `blocks` json NOT NULL,
  `settings` json,
  `isPublished` boolean NOT NULL DEFAULT false,
  `publishedAt` timestamp,
  `views` int DEFAULT 0,
  `conversions` int DEFAULT 0,
  `metaPixelId` varchar(128),
  `customDomain` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `landingPages_id` PRIMARY KEY(`id`),
  UNIQUE KEY `landingPages_slug` (`slug`)
);

-- AI generation jobs queue
CREATE TABLE `aiGenerationJobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `type` enum('copy','script','image','video','voice','creative') NOT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `provider` varchar(64),
  `inputData` json,
  `outputData` json,
  `errorMessage` text,
  `creditsUsed` int DEFAULT 0,
  `startedAt` timestamp,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `aiGenerationJobs_id` PRIMARY KEY(`id`)
);
