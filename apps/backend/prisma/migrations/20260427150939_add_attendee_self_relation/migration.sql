-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "event_attendees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
