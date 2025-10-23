-- AlterTable
-- Make senderId and recipientId nullable to support wallet-only transactions
-- where sender/recipient might not be registered users

ALTER TABLE "Subscription" ALTER COLUMN "senderId" DROP NOT NULL;
ALTER TABLE "Subscription" ALTER COLUMN "recipientId" DROP NOT NULL;

