import { randomBytes } from "crypto";
import { connect } from "net";
import { and, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/client";
import { agentRequestNonces, incidents, serverAgents, serverMetrics, servers, serviceChecks } from "@/infrastructure/db/schema";
import { deriveTokenHash, isTimestampFresh, verifySignature, type AgentAuthHeaders, type AuthFailure } from "./agent-auth";
import { DEFAULT_ALERT_STATE, evaluateAlert, type AlertConfig, type AlertState } from "./alerts";
import { computeServerStatus } from "./status";
import type { AgentTokenIssued, IncidentView, MetricPoint, ServerDetail, ServerMetricSnapshot, ServerNode, ServersMode, ServiceCheckView } from "./types";

type Db = ReturnType<typeof getDb>;
type ServerRow = typeof servers.$inferSelect;
type IncidentRow = typeof incidents.$inferSelect;
type MetricRow = typeof serverMetrics.$inferSelect;
type ServiceCheckRow = typeof serviceChecks.$inferSelect;

export function shapeServer(row:ServerRow):ServerNode{return {id:String(row.id),name:row.name,hostname:row.hostname,tags:row.tags||[],notes:row.notes,status:computeServerStatus(row.lastHeartbeatAt),lastHeartbeatAt:row.lastHeartbeatAt?row.lastHeartbeatAt.toISOString():null,lastMetrics:row.lastMetrics,alertState:row.alertState||{}}}
export function shapeIncident(row:IncidentRow):IncidentView{return {id:String(row.id),serverId:String(row.serverId),source:row.source,sourceRef:row.sourceRef,severity:row.severity,title:row.title,body:row.body,status:row.status,openedAt:row.openedAt.toISOString(),resolvedAt:row.resolvedAt?row.resolvedAt.toISOString():null,readAt:row.readAt?row.readAt.toISOString():null}}
export function shapeMetric(row:MetricRow):MetricPoint{return {recordedAt:row.recordedAt.toISOString(),cpuPercent:row.cpuPercent,memoryPercent:row.memoryPercent,diskPercent:row.diskPercent,loadAvg1:row.loadAvg1}}
export function shapeServiceCheck(row:ServiceCheckRow):ServiceCheckView{return {id:String(row.id),serverId:String(row.serverId),name:row.name,type:row.type,target:row.target,lastProbeStatus:row.lastProbeStatus,lastProbeAt:row.lastProbeAt?row.lastProbeAt.toISOString():null,alertStatus:row.alertStatus,enabled:row.enabled}}

// ---- reads ----

export async function loadServersForOwner():Promise<{servers:ServerNode[];mode:ServersMode}>{
  try{
    const db=getDb();
    const rows=await db.select().from(servers).orderBy(servers.name);
    return {servers:rows.map(shapeServer),mode:"live"};
  }catch{
    return {servers:[],mode:"unavailable"};
  }
}

export async function loadServerDetail(id:string):Promise<{detail:ServerDetail|null;mode:ServersMode}>{
  try{
    const db=getDb();
    const [row]=await db.select().from(servers).where(eq(servers.id,id));
    if(!row)return {detail:null,mode:"live"};
    const [metricRows,incidentRows,checkRows]=await Promise.all([
      db.select().from(serverMetrics).where(eq(serverMetrics.serverId,id)).orderBy(desc(serverMetrics.recordedAt)).limit(200),
      db.select().from(incidents).where(eq(incidents.serverId,id)).orderBy(desc(incidents.openedAt)).limit(50),
      db.select().from(serviceChecks).where(eq(serviceChecks.serverId,id)).orderBy(serviceChecks.name)
    ]);
    return {detail:{server:shapeServer(row),metrics:metricRows.map(shapeMetric).reverse(),incidents:incidentRows.map(shapeIncident),serviceChecks:checkRows.map(shapeServiceCheck)},mode:"live"};
  }catch{
    return {detail:null,mode:"unavailable"};
  }
}

// ---- admin CRUD ----

export interface ServerInput { name:string; hostname:string; tags:string[]; notes:string }

export async function createServer(input:ServerInput):Promise<ServerNode>{
  const db=getDb();
  const [row]=await db.insert(servers).values(input).returning();
  return shapeServer(row);
}
export async function updateServer(id:string,input:Partial<ServerInput>):Promise<ServerNode|null>{
  const db=getDb();
  const [row]=await db.update(servers).set({...input,updatedAt:new Date()}).where(eq(servers.id,id)).returning();
  return row?shapeServer(row):null;
}
export async function deleteServer(id:string):Promise<void>{
  const db=getDb();
  await db.delete(servers).where(eq(servers.id,id));
}
export async function issueServerToken(serverId:string):Promise<AgentTokenIssued>{
  const db=getDb();
  const rawToken=randomBytes(32).toString("hex");
  const tokenHash=deriveTokenHash(rawToken);
  const tokenId=randomBytes(12).toString("hex");
  const tokenPrefix=rawToken.slice(0,8);
  await db.insert(serverAgents).values({serverId,tokenId,tokenHash,tokenPrefix,active:true});
  return {tokenId,rawToken,tokenPrefix};
}
export async function revokeServerToken(id:string):Promise<void>{
  const db=getDb();
  await db.update(serverAgents).set({active:false,revokedAt:new Date()}).where(eq(serverAgents.id,id));
}

// ---- incidents / notifications ----

async function openIncident(db:Db,serverId:string,source:string,sourceRef:string,severity:string,title:string,body:string):Promise<void>{
  await db.insert(incidents).values({serverId,source,sourceRef,severity,title,body,status:"open"});
}
async function resolveIncident(db:Db,serverId:string,source:string,sourceRef:string):Promise<void>{
  await db.update(incidents).set({status:"resolved",resolvedAt:new Date()}).where(and(eq(incidents.serverId,serverId),eq(incidents.source,source),eq(incidents.sourceRef,sourceRef),eq(incidents.status,"open")));
}

export async function loadNotificationFeed():Promise<{incidents:IncidentView[];mode:ServersMode}>{
  try{
    const db=getDb();
    const rows=await db.select().from(incidents).orderBy(desc(incidents.openedAt)).limit(100);
    const sorted=[...rows].sort((a,b)=>{
      const aUnread=a.status==="open"&&!a.readAt;
      const bUnread=b.status==="open"&&!b.readAt;
      if(aUnread!==bUnread)return aUnread?-1:1;
      return b.openedAt.getTime()-a.openedAt.getTime();
    });
    return {incidents:sorted.map(shapeIncident),mode:"live"};
  }catch{
    return {incidents:[],mode:"unavailable"};
  }
}
export async function markIncidentRead(id:string):Promise<void>{
  const db=getDb();
  await db.update(incidents).set({readAt:new Date()}).where(eq(incidents.id,id));
}
export async function markAllIncidentsRead():Promise<void>{
  const db=getDb();
  await db.update(incidents).set({readAt:new Date()}).where(and(eq(incidents.status,"open"),isNull(incidents.readAt)));
}

// ---- agent request authentication ----

export async function authenticateAgentRequest(headers:AgentAuthHeaders,method:string,path:string,body:string):Promise<{ok:true;serverId:string;agentRowId:string}|{ok:false;reason:AuthFailure}>{
  const db=getDb();
  const [agent]=await db.select().from(serverAgents).where(eq(serverAgents.tokenId,headers.tokenId));
  if(!agent)return {ok:false,reason:"unknown_token"};
  if(!agent.active||agent.revokedAt)return {ok:false,reason:"revoked"};
  if(!isTimestampFresh(headers.timestamp))return {ok:false,reason:"stale"};
  const serverId=String(agent.serverId);
  const cutoff=new Date(Date.now()-Number(process.env.AGENT_TIME_WINDOW_SECONDS??300)*1000);
  await db.delete(agentRequestNonces).where(and(eq(agentRequestNonces.serverId,serverId),lt(agentRequestNonces.seenAt,cutoff)));
  try{
    await db.insert(agentRequestNonces).values({serverId,nonce:headers.nonce});
  }catch{
    return {ok:false,reason:"replay"};
  }
  if(!verifySignature(agent.tokenHash,method,path,headers.timestamp,headers.nonce,body,headers.signature))return {ok:false,reason:"invalid_signature"};
  await db.update(serverAgents).set({lastSeenAt:new Date()}).where(eq(serverAgents.id,agent.id));
  return {ok:true,serverId,agentRowId:String(agent.id)};
}

// ---- metric alert thresholds (hysteresis: fire above bad%, clear below good%) ----

const ALERT_CONFIGS:Record<"cpu"|"memory"|"disk",AlertConfig&{badPercent:number;goodPercent:number}> = {
  cpu:{badThreshold:3,goodThreshold:2,badPercent:Number(process.env.SERVER_ALERT_CPU_BAD_PERCENT??90),goodPercent:Number(process.env.SERVER_ALERT_CPU_GOOD_PERCENT??80)},
  memory:{badThreshold:3,goodThreshold:2,badPercent:Number(process.env.SERVER_ALERT_MEMORY_BAD_PERCENT??90),goodPercent:Number(process.env.SERVER_ALERT_MEMORY_GOOD_PERCENT??80)},
  disk:{badThreshold:3,goodThreshold:2,badPercent:Number(process.env.SERVER_ALERT_DISK_BAD_PERCENT??90),goodPercent:Number(process.env.SERVER_ALERT_DISK_GOOD_PERCENT??80)}
};

function applyMetricAlert(prev:AlertState|undefined,percent:number,config:AlertConfig&{badPercent:number;goodPercent:number}){
  const state=prev??DEFAULT_ALERT_STATE;
  const sampleIsBad=state.status==="alerting"?percent>=config.goodPercent:percent>config.badPercent;
  return evaluateAlert(state,sampleIsBad,config);
}

export async function recordHeartbeat(serverId:string,metrics:ServerMetricSnapshot):Promise<void>{
  const db=getDb();
  const [row]=await db.select().from(servers).where(eq(servers.id,serverId));
  if(!row)return;
  const alertState:Record<string,AlertState>={...row.alertState};
  const percentByKey:Record<"cpu"|"memory"|"disk",number>={cpu:metrics.cpuPercent,memory:metrics.memoryPercent,disk:metrics.diskPercent};
  for(const key of ["cpu","memory","disk"] as const){
    const result=applyMetricAlert(alertState[key],percentByKey[key],ALERT_CONFIGS[key]);
    alertState[key]=result.next;
    if(result.fire)await openIncident(db,serverId,"metric",key,"warning",`${key.toUpperCase()} usage above threshold`,`${key} at ${percentByKey[key]}%`);
    if(result.clear)await resolveIncident(db,serverId,"metric",key);
  }
  await db.update(servers).set({lastHeartbeatAt:new Date(),lastMetrics:metrics,alertState}).where(eq(servers.id,serverId));
  await db.insert(serverMetrics).values({serverId,resolution:"raw",cpuPercent:metrics.cpuPercent,memoryPercent:metrics.memoryPercent,diskPercent:metrics.diskPercent,loadAvg1:metrics.loadAvg1,recordedAt:new Date()});
}

export interface MetricSample { recordedAt:string; cpuPercent:number; memoryPercent:number; diskPercent:number; loadAvg1:number }
export async function recordMetricsBatch(serverId:string,samples:MetricSample[]):Promise<void>{
  if(samples.length===0)return;
  const db=getDb();
  await db.insert(serverMetrics).values(samples.map(s=>({serverId,resolution:"raw",cpuPercent:s.cpuPercent,memoryPercent:s.memoryPercent,diskPercent:s.diskPercent,loadAvg1:s.loadAvg1,recordedAt:new Date(s.recordedAt)})));
}

const SERVICE_CHECK_CONFIG:AlertConfig={badThreshold:2,goodThreshold:2};
export interface AgentServiceCheckSample { name:string; type:string; target:string; ok:boolean }
export async function recordServiceChecks(serverId:string,checks:AgentServiceCheckSample[]):Promise<void>{
  const db=getDb();
  for(const check of checks){
    const [existing]=await db.select().from(serviceChecks).where(and(eq(serviceChecks.serverId,serverId),eq(serviceChecks.name,check.name)));
    const prev:AlertState=existing?{consecutiveBad:existing.consecutiveBad,consecutiveGood:existing.consecutiveGood,status:existing.alertStatus==="alerting"?"alerting":"ok"}:DEFAULT_ALERT_STATE;
    const result=evaluateAlert(prev,!check.ok,SERVICE_CHECK_CONFIG);
    const lastProbeStatus=check.ok?"ok":"failing";
    if(existing){
      await db.update(serviceChecks).set({type:check.type,target:check.target,lastProbeStatus,lastProbeAt:new Date(),consecutiveBad:result.next.consecutiveBad,consecutiveGood:result.next.consecutiveGood,alertStatus:result.next.status,updatedAt:new Date()}).where(eq(serviceChecks.id,existing.id));
    }else{
      await db.insert(serviceChecks).values({serverId,name:check.name,type:check.type,target:check.target,lastProbeStatus,lastProbeAt:new Date(),consecutiveBad:result.next.consecutiveBad,consecutiveGood:result.next.consecutiveGood,alertStatus:result.next.status});
    }
    if(result.fire)await openIncident(db,serverId,"service",check.name,"critical",`Service ${check.name} is failing`,`Check ${check.name} (${check.type}:${check.target}) failed`);
    if(result.clear)await resolveIncident(db,serverId,"service",check.name);
  }
}

// ---- maintenance sweep (invoked by /api/cron/tick) ----

async function probeHttp(url:string,expectedStatus:number|null):Promise<boolean>{
  try{
    const res=await fetch(url,{method:"GET",signal:AbortSignal.timeout(5000)});
    return expectedStatus?res.status===expectedStatus:res.ok;
  }catch{
    return false;
  }
}
function probeTcp(target:string):Promise<boolean>{
  const [host,portStr]=target.split(":");
  const port=Number(portStr);
  if(!host||!Number.isFinite(port))return Promise.resolve(false);
  return new Promise(resolve=>{
    const socket=connect({host,port,timeout:5000});
    socket.once("connect",()=>{socket.destroy();resolve(true)});
    socket.once("error",()=>resolve(false));
    socket.once("timeout",()=>{socket.destroy();resolve(false)});
  });
}
async function runEnabledHttpTcpChecks():Promise<void>{
  const db=getDb();
  const checks=await db.select().from(serviceChecks).where(and(eq(serviceChecks.enabled,true),inArray(serviceChecks.type,["http","tcp"])));
  for(const check of checks){
    const ok=check.type==="http"?await probeHttp(check.target,check.expectedStatus):await probeTcp(check.target);
    await recordServiceChecks(String(check.serverId),[{name:check.name,type:check.type,target:check.target,ok}]);
  }
}

async function aggregateAndPruneMetrics():Promise<void>{
  const db=getDb();
  const rawCutoff=new Date(Date.now()-Number(process.env.AGENT_METRICS_RAW_RETENTION_DAYS??7)*86400000);
  const hourlyCutoff=new Date(Date.now()-Number(process.env.AGENT_METRICS_HOURLY_RETENTION_DAYS??90)*86400000);
  const oldRaw=await db.select().from(serverMetrics).where(and(eq(serverMetrics.resolution,"raw"),lt(serverMetrics.recordedAt,rawCutoff)));
  const avg=(values:number[])=>values.reduce((a,b)=>a+b,0)/values.length;
  const byBucket=new Map<string,{serverId:string;hour:Date;cpu:number[];memory:number[];disk:number[];load:number[]}>();
  for(const row of oldRaw){
    const hour=new Date(row.recordedAt);hour.setMinutes(0,0,0);
    const key=`${row.serverId}:${hour.toISOString()}`;
    const bucket=byBucket.get(key)??{serverId:String(row.serverId),hour,cpu:[],memory:[],disk:[],load:[]};
    bucket.cpu.push(row.cpuPercent);bucket.memory.push(row.memoryPercent);bucket.disk.push(row.diskPercent);bucket.load.push(row.loadAvg1);
    byBucket.set(key,bucket);
  }
  for(const bucket of byBucket.values()){
    await db.insert(serverMetrics).values({serverId:bucket.serverId,resolution:"hourly",cpuPercent:avg(bucket.cpu),memoryPercent:avg(bucket.memory),diskPercent:avg(bucket.disk),loadAvg1:avg(bucket.load),recordedAt:bucket.hour});
  }
  if(oldRaw.length>0)await db.delete(serverMetrics).where(and(eq(serverMetrics.resolution,"raw"),lt(serverMetrics.recordedAt,rawCutoff)));
  await db.delete(serverMetrics).where(and(eq(serverMetrics.resolution,"hourly"),lt(serverMetrics.recordedAt,hourlyCutoff)));
}

async function pruneStaleNonces():Promise<void>{
  const db=getDb();
  const cutoff=new Date(Date.now()-Number(process.env.AGENT_TIME_WINDOW_SECONDS??300)*1000);
  await db.delete(agentRequestNonces).where(lt(agentRequestNonces.seenAt,cutoff));
}

export async function runMaintenanceSweep():Promise<void>{
  const db=getDb();
  const allServers=await db.select().from(servers);
  for(const row of allServers){
    const status=computeServerStatus(row.lastHeartbeatAt);
    const prev=row.alertState.heartbeat??DEFAULT_ALERT_STATE;
    const sampleIsBad=prev.status==="alerting"?status!=="online":status==="offline";
    const result=evaluateAlert(prev,sampleIsBad,{badThreshold:1,goodThreshold:1});
    if(result.next.status!==prev.status||result.next.consecutiveBad!==prev.consecutiveBad||result.next.consecutiveGood!==prev.consecutiveGood){
      await db.update(servers).set({alertState:{...row.alertState,heartbeat:result.next}}).where(eq(servers.id,row.id));
    }
    if(result.fire)await openIncident(db,String(row.id),"heartbeat","offline","critical",`${row.name} appears offline`,"No heartbeat received within the offline threshold");
    if(result.clear)await resolveIncident(db,String(row.id),"heartbeat","offline");
  }
  await runEnabledHttpTcpChecks();
  await aggregateAndPruneMetrics();
  await pruneStaleNonces();
}
