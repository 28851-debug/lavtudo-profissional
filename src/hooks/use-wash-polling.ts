import { useCallback, useEffect, useState } from "react";
import type { Wash } from "@/lib/washes";

type PollingState = {
  wash: Wash | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useWashPolling(id: string, intervalMs = 1000) {
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<PollingState>({
    wash: null,
    loading: true,
    refreshing: false,
    error: null,
  });

  useEffect(() => {
    let stopped = false;
    let timeout: number | undefined;
    let controller: AbortController | undefined;

    const poll = async () => {
      controller = new AbortController();
      setState((current) => ({ ...current, refreshing: current.wash !== null }));

      try {
        const response = await fetch(`/api/washes/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const body = (await response.json()) as { wash?: Wash; error?: string };
        if (!response.ok || !body.wash) {
          throw new Error(body.error || "Não foi possível consultar esta lavagem.");
        }
        if (!stopped) {
          setState({ wash: body.wash, loading: false, refreshing: false, error: null });
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((current) => ({
            ...current,
            loading: false,
            refreshing: false,
            error: error instanceof Error ? error.message : "Falha de conexão.",
          }));
        }
      } finally {
        if (!stopped) timeout = window.setTimeout(poll, intervalMs);
      }
    };

    void poll();
    return () => {
      stopped = true;
      if (timeout) window.clearTimeout(timeout);
      controller?.abort();
    };
  }, [id, intervalMs, retryKey]);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: current.wash === null, error: null }));
    setRetryKey((value) => value + 1);
  }, []);

  return { ...state, retry };
}
