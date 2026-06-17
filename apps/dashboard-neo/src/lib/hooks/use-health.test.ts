import { describe, expect, it } from "vitest"
import {
  canInvokeRuntime,
  isRuntimeReadySession,
  type HealthData,
} from "./use-health"

describe("runtime readiness helpers", () => {
  it("allows runtime calls when health marks the session ready", () => {
    expect(
      isRuntimeReadySession({ ready: true, state: "AUTHENTICATING" })
    ).toBe(true)
  })

  it("allows runtime calls for known ready states", () => {
    expect(isRuntimeReadySession({ state: "READY" })).toBe(true)
    expect(isRuntimeReadySession({ state: "CONNECTED" })).toBe(true)
  })

  it("blocks runtime calls during pre-auth states", () => {
    expect(isRuntimeReadySession({ ready: false, state: "STARTING" })).toBe(
      false
    )
    expect(
      isRuntimeReadySession({ ready: false, state: "AUTHENTICATING" })
    ).toBe(false)
    expect(isRuntimeReadySession({ ready: false, state: "DISCONNECTED" })).toBe(
      false
    )
    expect(isRuntimeReadySession(null)).toBe(false)
  })

  it("derives runtime call permission from health data", () => {
    expect(canInvokeRuntime({ session: { ready: true } } as HealthData)).toBe(
      true
    )
    expect(
      canInvokeRuntime({
        session: { ready: false, state: "AUTHENTICATING" },
      } as HealthData)
    ).toBe(false)
    expect(canInvokeRuntime(null)).toBe(false)
  })
})
