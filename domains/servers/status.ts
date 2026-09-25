export type ServerStatus = "online" | "degraded" | "offline" | "unknown";

export function computeServerStatus(lastHeartbeatAt:Date|null,now:Date=new Date()):ServerStatus{
  if(!lastHeartbeatAt)return "unknown";
  const ageSeconds=(now.getTime()-lastHeartbeatAt.getTime())/1000;
  if(ageSeconds<0)return "unknown";
  const degradedAfter=Number(process.env.SERVER_STATUS_DEGRADED_AFTER_SECONDS??90);
  const offlineAfter=Number(process.env.SERVER_STATUS_OFFLINE_AFTER_SECONDS??300);
  if(ageSeconds>offlineAfter)return "offline";
  if(ageSeconds>degradedAfter)return "degraded";
  return "online";
}
