'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns `true` once the component has mounted on the client.
 *
 * Uses `useSyncExternalStore` so the transition from "server snapshot"
 * (`false`) to "client snapshot" (`true`) is handled by React's hydration
 * machinery rather than by a `setState` inside `useEffect`. This avoids the
 * cascading-render warning emitted by `react-hooks/set-state-in-effect`
 * (introduced in `eslint-plugin-react-hooks` v7) for the classic
 * `useEffect(() => setMounted(true), [])` pattern.
 *
 * Use this hook anywhere you need to gate browser-only rendering (e.g.
 * `next-themes`, timers, locale-dependent formatting) without coupling each
 * component to its own piece of mount-tracking state.
 */
const subscribe = () => () => {
  // No external source to subscribe to — value is computed from the snapshot.
};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
