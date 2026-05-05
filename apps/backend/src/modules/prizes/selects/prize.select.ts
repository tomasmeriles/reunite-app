import { Prisma } from '@prisma/client';

export const prizeListInclude = {
  winner: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  },
} satisfies Prisma.PrizeInclude;

export type PrizeListPayload = Prisma.PrizeGetPayload<{
  include: typeof prizeListInclude;
}>;

export const prizeDetailInclude = {
  ...prizeListInclude,
  event: true,
} satisfies Prisma.PrizeInclude;

export type PrizeDetailPayload = Prisma.PrizeGetPayload<{
  include: typeof prizeDetailInclude;
}>;
