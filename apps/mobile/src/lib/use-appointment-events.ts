import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

const POLL_INTERVAL_MS = 10_000;

// Subscribes to real-time appointment changes for a specific salon.
// Uses Supabase Realtime when EXPO_PUBLIC_SUPABASE_URL is configured;
// falls back to 10-second polling otherwise (e.g. plain local Postgres in dev).
// salonId: the salon to watch — events are filtered server-side by salon_id.
// onEvent: called on any INSERT or UPDATE to the Appointment table for this salon.
export function useAppointmentEvents(salonId: string, onEvent: () => void): void {
  // Keep a ref so the effect closure always calls the latest version of onEvent
  // without needing to be re-registered every render.
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!salonId) return;

    if (supabase) {
      const client = supabase;
      const channel = client
        .channel(`appointments:${salonId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Appointment',
            filter: `salon_id=eq.${salonId}`,
          },
          () => callbackRef.current(),
        )
        .subscribe();

      return () => { void client.removeChannel(channel); };
    }

    // Polling fallback — fires every 10 s when Supabase Realtime is not configured.
    const id = setInterval(() => callbackRef.current(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [salonId]);
}
