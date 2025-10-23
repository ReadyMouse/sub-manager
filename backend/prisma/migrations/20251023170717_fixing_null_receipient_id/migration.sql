-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Subscription" DROP CONSTRAINT "Subscription_senderId_fkey";

-- AlterTable
ALTER TABLE "ConnectedWallet" ADD COLUMN     "currencyTicker" TEXT NOT NULL DEFAULT 'PYUSD';

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "senderWalletAddress" DROP NOT NULL,
ALTER COLUMN "recipientWalletAddress" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
