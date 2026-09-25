import { z } from "zod";
export const vaultRecordInput = z.object({ alias: z.string().min(1).max(120), provider: z.string().max(120).default(""), tags: z.array(z.string()).default([]), redactedAddress: z.string().max(255).default(""), username: z.string().max(255).default(""), port: z.number().int().min(1).max(65535).nullable().default(null), notes: z.string().max(2000).default(""), managerRef: z.string().max(255).default(""), sshCommandTemplate: z.string().max(500).default("") });
export const vaultRecordUpdate = vaultRecordInput.partial();
