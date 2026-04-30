/*
  Warnings:

  - You are about to drop the column `note` on the `invite_links` table. All the data in the column will be lost.
  - You are about to drop the column `usedCount` on the `invite_links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invite_links" DROP COLUMN "note",
DROP COLUMN "usedCount",
ADD COLUMN     "label" TEXT,
ADD COLUMN     "useCount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
