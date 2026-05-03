-- CreateEnum
CREATE TYPE "AttendeeAccess" AS ENUM ('ANYONE', 'ATTENDEES_ONLY', 'ORGANIZERS_ONLY', 'DISABLED');

-- Add nullable column first so existing rows are accepted
ALTER TABLE "event_configs" ADD COLUMN "attendeeAccess" "AttendeeAccess";

-- Backfill: true → ANYONE, false → ATTENDEES_ONLY
UPDATE "event_configs"
SET "attendeeAccess" = CASE
  WHEN "attendeesPublic" = true THEN 'ANYONE'::"AttendeeAccess"
  ELSE 'ATTENDEES_ONLY'::"AttendeeAccess"
END;

-- Apply NOT NULL constraint and default after backfill
ALTER TABLE "event_configs"
  ALTER COLUMN "attendeeAccess" SET NOT NULL,
  ALTER COLUMN "attendeeAccess" SET DEFAULT 'ATTENDEES_ONLY'::"AttendeeAccess";

-- Drop old boolean column
ALTER TABLE "event_configs" DROP COLUMN "attendeesPublic";
