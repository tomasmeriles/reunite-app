import { z } from 'zod';

export const createInviteLinkSchema = z.object({
  label: z.string().optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});

export type CreateInviteLinkFormValues = z.infer<typeof createInviteLinkSchema>;
