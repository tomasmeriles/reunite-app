/*
  Warnings:

  - You are about to drop the column `mediaEnabled` on the `event_configs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaAccess" AS ENUM ('ANYONE', 'ATTENDEES_ONLY', 'ORGANIZERS_ONLY', 'DISABLED');

-- AlterTable
ALTER TABLE "event_configs" DROP COLUMN "mediaEnabled",
ADD COLUMN     "mediaAccess" "MediaAccess" NOT NULL DEFAULT 'ATTENDEES_ONLY';

-- AlterTable
ALTER TABLE "media_items" ADD COLUMN     "uploadedByUserId" TEXT,
ALTER COLUMN "attendeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
