import type { AysEvent, EventName } from "./types";
import { handleSlackEvent } from "./listeners/slack";
import { handleZapierEvent } from "./listeners/zapier";

type Listener = <T extends EventName>(event: T, payload: AysEvent[T]) => Promise<void>;

const LISTENERS: Listener[] = [handleSlackEvent, handleZapierEvent];

/**
 * Dispatches a typed internal event to all registered listeners.
 * Fire-and-forget: listeners run non-blocking, errors are logged but never thrown.
 * Call this after the main response has been sent to the user.
 *
 * To add a new integration: create lib/events/listeners/yourIntegration.ts
 * and add it to the LISTENERS array above. No other changes needed.
 */
export function dispatchEvent<T extends EventName>(
  event: T,
  payload: AysEvent[T]
): void {
  void Promise.allSettled(LISTENERS.map((l) => l(event, payload))).then(
    (results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[events] listener ${i} failed for "${event}":`, r.reason);
        }
      });
    }
  );
}
