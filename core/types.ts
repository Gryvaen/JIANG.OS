export type AppId = "projects" | "github" | "about" | "notes" | "files" | "terminal" | "settings";
export type AppCategory = "SYSTEM" | "PERSONAL";
export interface AppWindowConstraints { minWidth: number; minHeight: number; maxWidth?: number; maxHeight?: number }
export interface AppDefinition { id: AppId; name: string; shortName: string; category: AppCategory; description: string; icon: string; keywords: string[]; shells: ("desktop" | "mobile")[]; defaultSize: { width: number; height: number }; singleton: boolean; windowConstraints: AppWindowConstraints; access: "public" | "owner"; routePattern?: string; searchIndexable: boolean }
export interface WindowState { instanceId: string; appId: AppId; x: number; y: number; width: number; height: number; status: "open" | "minimized" | "maximized"; zIndex: number; previous?: Pick<WindowState,"x"|"y"|"width"|"height">; snapped?: "left" | "right" }
export interface SystemCommand { id: string; label: string; keywords: string[]; appId?: AppId; execute: (ctx: CommandContext, args: string[]) => CommandResult }
export interface CommandContext { openApp: (id: AppId) => void; setTheme: (theme: "dark" | "light") => void }
export interface CommandResult { ok: boolean; output?: string; clear?: boolean }
export interface VfsNode { path: string; name: string; type: "directory" | "file"; content?: string; children?: string[]; access: "public" | "owner" }
