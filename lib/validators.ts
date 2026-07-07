import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(100).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
});

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
