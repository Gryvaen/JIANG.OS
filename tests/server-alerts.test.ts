import { describe, expect, it } from "vitest";
import { DEFAULT_ALERT_STATE, evaluateAlert } from "@/domains/servers/alerts";

const config = { badThreshold: 3, goodThreshold: 2 };

describe("evaluateAlert", () => {
  it("does not fire before the bad streak reaches the threshold", () => {
    let state = DEFAULT_ALERT_STATE;
    for (let i = 0; i < 2; i++) {
      const result = evaluateAlert(state, true, config);
      expect(result.fire).toBe(false);
      state = result.next;
    }
    expect(state.status).toBe("ok");
  });
  it("fires exactly once when the bad streak reaches the threshold", () => {
    let state = DEFAULT_ALERT_STATE;
    for (let i = 0; i < 3; i++) state = evaluateAlert(state, true, config).next;
    expect(state.status).toBe("alerting");
    const again = evaluateAlert(state, true, config);
    expect(again.fire).toBe(false);
    expect(again.next.status).toBe("alerting");
  });
  it("does not re-fire on repeated bad samples while already alerting", () => {
    let state = DEFAULT_ALERT_STATE;
    for (let i = 0; i < 3; i++) state = evaluateAlert(state, true, config).next;
    for (let i = 0; i < 5; i++) {
      const result = evaluateAlert(state, true, config);
      expect(result.fire).toBe(false);
      state = result.next;
    }
  });
  it("clears once the good streak reaches the recovery threshold", () => {
    let state = DEFAULT_ALERT_STATE;
    for (let i = 0; i < 3; i++) state = evaluateAlert(state, true, config).next;
    let lastResult = evaluateAlert(state, false, config);
    state = lastResult.next;
    expect(lastResult.clear).toBe(false);
    lastResult = evaluateAlert(state, false, config);
    state = lastResult.next;
    expect(lastResult.clear).toBe(true);
    expect(state.status).toBe("ok");
  });
  it("resets the bad streak on a flapping good sample", () => {
    let state = evaluateAlert(DEFAULT_ALERT_STATE, true, config).next;
    state = evaluateAlert(state, true, config).next;
    state = evaluateAlert(state, false, config).next;
    expect(state.consecutiveBad).toBe(0);
    expect(state.status).toBe("ok");
  });
});
