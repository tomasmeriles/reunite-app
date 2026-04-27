-- AlterTable
ALTER TABLE "events" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);
