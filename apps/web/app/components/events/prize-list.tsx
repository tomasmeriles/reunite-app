import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent } from '~/components/ui/card';
import { Modal } from '~/components/ui/modal';
import { Skeleton } from '~/components/ui/skeleton';
import {
  usePrizes,
  useCreatePrize,
  useAssignWinner,
  useDeletePrize,
} from '~/hooks/api/use-prizes';
import { getApiErrorMessage } from '~/lib/axios';
import type { Prize } from '~/api/prizes/prizes.types';

interface PrizeListProps {
  eventId: string;
  canManage: boolean;
}

export function PrizeList({ eventId, canManage }: PrizeListProps) {
  const { data: prizes, isLoading } = usePrizes(eventId);
  const { mutate: createPrize, isPending: creating } = useCreatePrize(eventId);
  const { mutate: assignWinner, isPending: assigning } =
    useAssignWinner(eventId);
  const { mutate: deletePrize } = useDeletePrize(eventId);

  const [newTitle, setNewTitle] = useState('');
  const [drawPrize, setDrawPrize] = useState<Prize | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createPrize(
      { title: newTitle.trim() },
      {
        onSuccess: () => {
          setNewTitle('');
          toast.success('Prize added');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleRandomDraw = (prizeId: string) => {
    assignWinner(
      { prizeId },
      {
        onSuccess: (prize) => {
          setDrawPrize(prize);
          toast.success('Winner drawn!');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const getWinnerName = (prize: Prize) => {
    if (!prize.winner) return null;
    return prize.winner.user?.name ?? prize.winner.guestName ?? 'Guest';
  };

  const ordinal = (n: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? 'th');
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex gap-2">
          <Input
            placeholder="Prize title (e.g. Best Outfit 🏆)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <Button onClick={handleCreate} disabled={creating}>
            Add
          </Button>
        </div>
      )}

      {!prizes?.length && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No prizes yet.
        </p>
      )}

      <div className="space-y-3">
        {prizes?.map((prize) => {
          const winnerName = getWinnerName(prize);
          return (
            <Card key={prize.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {ordinal(prize.position)}
                    </span>
                    <p className="font-medium">{prize.title}</p>
                  </div>
                  {winnerName && (
                    <Badge variant="outline" className="text-xs">
                      🏆 {winnerName}
                    </Badge>
                  )}
                </div>

                {canManage && !prize.winnerId && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRandomDraw(prize.id)}
                      disabled={assigning}
                    >
                      Draw winner
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePrize(prize.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Winner announcement dialog */}
      <Modal
        open={!!drawPrize}
        onOpenChange={() => setDrawPrize(null)}
        title="🎉 We have a winner!"
        contentClassName="text-center"
        size="sm"
      >
        {drawPrize && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-4xl font-bold">{getWinnerName(drawPrize)}</p>
              <p className="text-muted-foreground">
                wins the <strong>{drawPrize.title}</strong> prize!
              </p>
            </div>
            <Button className="w-full" onClick={() => setDrawPrize(null)}>
              Awesome!
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
