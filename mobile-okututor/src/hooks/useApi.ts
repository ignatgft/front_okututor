import { useCallback, useEffect, useRef, useState } from "react";
import { ApiResult } from "../api/types";
import { normalizeApiError } from "../api/client/errorMapper";
import { toErrorMessage } from "../utils/error";

interface UseApiOptions<D> {
  /** Skip the first automatic fetch. */
  lazy?: boolean;
  onData?: (data: D) => void;
}

export interface UseApiState<D> {
  data: D | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: D | null) => void;
  reset: () => void;
}

/**
 * Minimal data-loading hook shared by screens. Runs `fetcher` on mount or on
 * `refetch`, guards against stale resolutions, and normalizes failures into a
 * single string for the UI.
 */
export function useApi<D>(
  fetcher: () => ApiResult<D>,
  deps: unknown[],
  options: UseApiOptions<D> = {}
): UseApiState<D> {
  const { lazy = false, onData } = options;
  const [data, setData] = useState<D | null>(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const { response, data: payload } = await fetcherRef.current();
      if (requestId !== requestIdRef.current) return;
      if (!response.ok) {
        const d = payload as { message?: string; error?: string } | null;
        setError(d?.message || d?.error || "Failed to load data");
        setData(null);
      } else {
        setData(payload);
        if (payload !== null) onData?.(payload);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const normalized = normalizeApiError({ cause: err instanceof Error ? { name: err.name } : undefined });
      setError(toErrorMessage(err, normalized.message));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
    // deps is intentionally a caller-supplied array literal
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    if (lazy) return;
    run();
    return () => {
      requestIdRef.current += 1;
    };
  }, [run, lazy]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, refetch: run, setData, reset };
}