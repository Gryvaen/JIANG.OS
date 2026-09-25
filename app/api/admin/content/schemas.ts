import { z } from "zod";
export const projectInput = z.object({ title: z.string().min(2).max(120), slug: z.string().regex(/^[a-z0-9-]+$/), summary: z.string().min(2).max(500), category: z.string().min(2).max(100), published: z.boolean().default(false) });
export const noteInput = z.object({ title: z.string().min(2).max(160), slug: z.string().regex(/^[a-z0-9-]+$/), excerpt: z.string().min(2).max(500), body: z.string().min(2), published: z.boolean().default(false) });
export const projectUpdate = projectInput.partial();
export const noteUpdate = noteInput.partial();
export const quickLinkInput = z.object({ label: z.string().min(1).max(80), url: z.string().url(), icon: z.string().min(1).max(40).default("link"), groupLabel: z.string().min(1).max(60).default("General"), keywords: z.array(z.string()).default([]), enabled: z.boolean().default(true) });
export const quickLinkUpdate = quickLinkInput.partial();
