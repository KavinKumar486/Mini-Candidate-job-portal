-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('CANDIDATE') NOT NULL DEFAULT 'CANDIDATE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key` (`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CandidateProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `headline` VARCHAR(191) NULL,
    `summary` TEXT NULL,
    `skills` JSON NULL,
    `experienceYears` INTEGER NULL,
    `currentTitle` VARCHAR(191) NULL,
    `resumePath` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `githubUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `CandidateProfile_userId_key` (`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `jobType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP') NOT NULL,
    `workMode` ENUM('ONSITE', 'REMOTE', 'HYBRID') NOT NULL,
    `experienceLevel` VARCHAR(191) NOT NULL,
    `salaryMin` INTEGER NULL,
    `salaryMax` INTEGER NULL,
    `skills` JSON NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `postedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Job_title_idx` (`title`),
    INDEX `Job_location_idx` (`location`),
    INDEX `Job_jobType_idx` (`jobType`),
    INDEX `Job_workMode_idx` (`workMode`),
    INDEX `Job_status_idx` (`status`),
    INDEX `Job_postedAt_idx` (`postedAt`),
    INDEX `Job_status_postedAt_idx` (`status`, `postedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `coverNote` TEXT NULL,
    `resumePath` VARCHAR(191) NOT NULL,
    `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Application_userId_idx` (`userId`),
    INDEX `Application_status_idx` (`status`),
    UNIQUE INDEX `Application_userId_jobId_key` (`userId`, `jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN') NULL,
    `toStatus` ENUM('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN') NOT NULL,
    `note` VARCHAR(191) NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationStatusHistory_applicationId_changedAt_idx` (`applicationId`, `changedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CandidateProfile` ADD CONSTRAINT `CandidateProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationStatusHistory` ADD CONSTRAINT `ApplicationStatusHistory_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- FULLTEXT is MySQL-specific and not modelled in Prisma. Search uses parameterized Prisma `contains` (utf8mb4_unicode_ci is case-insensitive).
-- Optional later: ALTER TABLE `Job` ADD FULLTEXT INDEX `Job_search_idx` (`title`, `company`, `description`);
