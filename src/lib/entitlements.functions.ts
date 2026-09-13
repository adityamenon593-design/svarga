import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Current plan, limits and usage for the signed-in user. */
export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getUsageSnapshot, tierLabel } = await import("@/lib/entitlements.server");
    const snapshot = await getUsageSnapshot(context.userId);
    return {
      tier: snapshot.tier,
      label: tierLabel(snapshot.tier),
      questionsUsed: snapshot.questionsUsed,
      questionsAllowed: snapshot.limits.questions,
      questionWindow: snapshot.limits.questionWindow,
      imagesUsed: snapshot.imagesUsed,
      imagesAllowed: snapshot.limits.images,
      modes: snapshot.limits.modes,
    };
  });
