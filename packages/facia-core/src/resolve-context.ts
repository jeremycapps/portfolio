import type { ResolveContext } from "./answer-set-v2.js";

export function isResolveContext(input: unknown): input is ResolveContext {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return false;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.every((key) => key === "depth" || key === "audience")
    && ["glance", "inspect", "focus", "audit"].includes(record.depth as string)
    && (record.audience === undefined
      || (typeof record.audience === "string" && record.audience.length > 0));
}
