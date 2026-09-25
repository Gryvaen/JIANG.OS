import type { AppDefinition, SystemCommand } from "./types";
// Extension point for apps that need to register commands beyond the
// auto-generated `open.<id>` entry (e.g. "yt <query>" once a Web app exists).
// Empty today — no app needs extra commands yet.
export const commandContributions: Partial<Record<AppDefinition["id"], (app: AppDefinition) => SystemCommand[]>> = {};
