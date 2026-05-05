import { z } from 'zod';

export const joinSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});

export type JoinFormValues = z.infer<typeof joinSchema>;
