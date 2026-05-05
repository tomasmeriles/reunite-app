import { Prisma } from '@prisma/client';

export const eventDefaultOrderBy = [
  { startAt: 'asc' },
] satisfies Prisma.EventOrderByWithRelationInput[];
