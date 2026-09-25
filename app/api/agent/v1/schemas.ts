import { z } from "zod";
export const heartbeatBody = z.object({ cpuPercent: z.number(), memoryPercent: z.number(), diskPercent: z.number(), loadAvg1: z.number(), uptimeSeconds: z.number() });
export const metricsBody = z.object({ samples: z.array(z.object({ recordedAt: z.string(), cpuPercent: z.number(), memoryPercent: z.number(), diskPercent: z.number(), loadAvg1: z.number() })) });
export const servicesBody = z.object({ checks: z.array(z.object({ name: z.string().min(1), type: z.string().min(1), target: z.string().min(1), ok: z.boolean() })) });
