/*
  Warnings:

  - Made the column `endAt` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- Backfill endAt for any existing rows that don't have it yet
UPDATE "events" SET "endAt" = "startAt" + ("duration" * INTERVAL '1 minute') WHERE "endAt" IS NULL;

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "endAt" SET NOT NULL;
