type Events = {
  "auth:logout": { reason?: string };
  "notifications:refresh": void;
};

type Listener<T = unknown> = (payload: T) => void;

const listeners = new Map<string, Set<Listener<unknown>>>();

export function onAuthEvent<K extends keyof Events>(
  event: K,
  listener: Listener<Events[K]>
): () => void {
  const set = listeners.get(event) || new Set<Listener<unknown>>();
  set.add(listener as Listener<unknown>);
  listeners.set(event, set);
  return () => offAuthEvent(event, listener as Listener<unknown>);
}

export function offAuthEvent(event: keyof Events, listener: Listener<unknown>): void {
  listeners.get(event)?.delete(listener);
}

export function emitAuthEvent<K extends keyof Events>(event: K, payload: Events[K]): void {
  const set = listeners.get(event);
  if (!set) return;
  set.forEach((listener) => {
    try {
      (listener as Listener<Events[K]>)(payload);
    } catch {
      // listeners must never break the emitter
    }
  });
}