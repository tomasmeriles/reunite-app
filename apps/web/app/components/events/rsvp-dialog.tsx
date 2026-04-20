import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { useAuth } from '~/contexts/auth';
import type { EventType } from '~/api/events/events.types';

interface RsvpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType: EventType;
  onSubmit: (guestName?: string, inviteToken?: string) => void;
  isLoading: boolean;
}

export function RsvpDialog({
  open,
  onOpenChange,
  eventType,
  onSubmit,
  isLoading,
}: RsvpDialogProps) {
  const { user } = useAuth();
  const [guestName, setGuestName] = useState('');

  const needsName = !user && eventType === 'PUBLIC';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(needsName ? guestName : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>RSVP to this event</DialogTitle>
          <DialogDescription>
            {user
              ? `You'll be registered as ${user.name ?? user.username}.`
              : "You'll join as a guest. No account needed!"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsName && (
            <div className="space-y-1.5">
              <Label htmlFor="guestName">Your name</Label>
              <Input
                id="guestName"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (needsName && !guestName.trim())}
            >
              {isLoading ? 'Joining…' : 'Count me in! 🎉'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
