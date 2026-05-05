/*
  Warnings:

  - You are about to drop the column `chatEnabled` on the `event_configs` table. All the data in the column will be lost.
  - You are about to drop the `chat_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_attendeeId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_eventId_fkey";

-- AlterTable
ALTER TABLE "event_configs" DROP COLUMN "chatEnabled";

-- DropTable
DROP TABLE "chat_messages";
