import { useEffect, useState } from "react";
import * as Network from "expo-network";

/**
 * Subscribes to platform network-connectivity changes. `isOffline` becomes
 * true when the device reports no internet connection.
 */
export function useNetworkStatus(): { isOffline: boolean; isInternetReachable: boolean } {
  const [isOffline, setIsOffline] = useState(false);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    let active = true;

    const applyState = (state: Network.NetworkState) => {
      if (!active) return;
      const reachable = state.isInternetReachable;
      setIsInternetReachable(reachable !== false);
      setIsOffline(reachable === false || state.isConnected === false);
    };

    Network.getNetworkStateAsync()
      .then(applyState)
      .catch(() => undefined);

    const sub = Network.addNetworkStateListener(applyState);

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return { isOffline, isInternetReachable };
}

export function useOffline(): boolean {
  return useNetworkStatus().isOffline;
}