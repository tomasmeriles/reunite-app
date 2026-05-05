/*
  Warnings:

  - The values [TENANT_MANAGER] on the enum `GlobalRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tenantId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `tenant_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tenants` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('OWNER', 'ORGANIZER');

-- AlterEnum
BEGIN;
CREATE TYPE "GlobalRole_new" AS ENUM ('SUPER_ADMIN', 'MODERATOR', 'MEMBER');
ALTER TABLE "public"."users" ALTER COLUMN "globalRole" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "globalRole" TYPE "GlobalRole_new" USING ("globalRole"::text::"GlobalRole_new");
ALTER TYPE "GlobalRole" RENAME TO "GlobalRole_old";
ALTER TYPE "GlobalRole_new" RENAME TO "GlobalRole";
DROP TYPE "public"."GlobalRole_old";
ALTER TABLE "users" ALTER COLUMN "globalRole" SET DEFAULT 'MEMBER';
COMMIT;

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_members" DROP CONSTRAINT "tenant_members_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenant_members" DROP CONSTRAINT "tenant_members_userId_fkey";

-- DropIndex
DROP INDEX "events_tenantId_key";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "tenantId";

-- DropTable
DROP TABLE "tenant_members";

-- DropTable
DROP TABLE "tenants";

-- DropEnum
DROP TYPE "TenantRole";

-- DropEnum
DROP TYPE "TenantType";

-- CreateTable
CREATE TABLE "event_staff" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventRole" NOT NULL DEFAULT 'ORGANIZER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_staff_eventId_idx" ON "event_staff"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_staff_eventId_userId_key" ON "event_staff"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
