import type { AlertState } from "./alerts";
import type { ServerStatus } from "./status";

export interface ServerMetricSnapshot { cpuPercent:number; memoryPercent:number; diskPercent:number; loadAvg1:number; uptimeSeconds:number }
export interface ServerNode { id:string; name:string; hostname:string; tags:string[]; notes:string; status:ServerStatus; lastHeartbeatAt:string|null; lastMetrics:ServerMetricSnapshot|null; alertState:Record<string,AlertState> }
export interface MetricPoint { recordedAt:string; cpuPercent:number; memoryPercent:number; diskPercent:number; loadAvg1:number }
export interface IncidentView { id:string; serverId:string; source:string; sourceRef:string|null; severity:string; title:string; body:string; status:string; openedAt:string; resolvedAt:string|null; readAt:string|null }
export interface ServiceCheckView { id:string; serverId:string; name:string; type:string; target:string; lastProbeStatus:string; lastProbeAt:string|null; alertStatus:string; enabled:boolean }
export interface ServerDetail { server:ServerNode; metrics:MetricPoint[]; incidents:IncidentView[]; serviceChecks:ServiceCheckView[] }
export type ServersMode = "live" | "unavailable";
export interface AgentTokenIssued { tokenId:string; rawToken:string; tokenPrefix:string }
