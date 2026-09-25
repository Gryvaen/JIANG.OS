import { z } from "zod";
export const serverInput = z.object({ name: z.string().min(1).max(120), hostname: z.string().min(1).max(255), tags: z.array(z.string()).default([]), notes: z.string().max(2000).default("") });
export const serverUpdate = serverInput.partial();
