import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget launch analytics. Records what people actually do on the
 * site — page views, chat starts, sign-ins, subscription clicks — so the
 * founder can see what is working. Never blocks the UI and never throws.
 */
export function track(name: string, label?: string) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname + window.location.search;
  void supabase.auth
    .getSession()
    .then(({ data }) =>
      supabase.from("analytics_events").insert({
        name: name.slice(0, 64),
        path: path.slice(0, 200),
        label: label ? label.slice(0, 120) : null,
        user_id: data.session?.user.id ?? null,
      }),
    )
    .then(
      () => undefined,
      () => undefined,
    );
}
