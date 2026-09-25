import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
export interface ToolDefinition { id:string; name:string; icon:LucideIcon; keywords:string[]; component:ComponentType }
