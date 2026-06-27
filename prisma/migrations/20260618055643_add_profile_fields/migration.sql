-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleteToken" TEXT,
ADD COLUMN     "deleteTokenExp" TIMESTAMP(3),
ADD COLUMN     "pendingEmail" TEXT;
