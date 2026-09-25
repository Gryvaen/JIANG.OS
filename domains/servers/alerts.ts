export interface AlertState { consecutiveBad:number; consecutiveGood:number; status:"ok"|"alerting" }
export interface AlertConfig { badThreshold:number; goodThreshold:number }
export interface AlertResult { next:AlertState; fire:boolean; clear:boolean }

export const DEFAULT_ALERT_STATE:AlertState = { consecutiveBad:0, consecutiveGood:0, status:"ok" };

// sampleIsBad is evaluated by the caller against different thresholds depending on
// whether the metric is currently alerting (e.g. fire at >90%, clear at <80%) so the
// hysteresis band comes from the predicate, not just the streak counts.
export function evaluateAlert(prev:AlertState,sampleIsBad:boolean,config:AlertConfig):AlertResult{
  const consecutiveBad=sampleIsBad?prev.consecutiveBad+1:0;
  const consecutiveGood=sampleIsBad?0:prev.consecutiveGood+1;
  const wasAlerting=prev.status==="alerting";
  const shouldAlert=wasAlerting?!(consecutiveGood>=config.goodThreshold):consecutiveBad>=config.badThreshold;
  return {
    next:{consecutiveBad,consecutiveGood,status:shouldAlert?"alerting":"ok"},
    fire:!wasAlerting&&shouldAlert,
    clear:wasAlerting&&!shouldAlert,
  };
}
