import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserLocation } from "@/hooks/useUserLocation";
import { INTRO_OFFER } from "@/config/introOffer";

/** Eligible = signed in and has never made a purchase. Server re-checks before charging. */
export const useIntroOffer = () => {
  const { user } = useAuth();
  const { currency } = useUserLocation();
  const isNigeria = currency === "NGN";

  const { data: eligible = false, refetch } = useQuery({
    queryKey: ["intro-offer-eligible", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("type", "purchase");
      if (error) return false;
      return (count ?? 0) === 0;
    },
  });

  const startCheckout = async () => {
    if (isNigeria) {
      const { data, error } = await supabase.functions.invoke("paystack-payment", {
        body: { packageKey: INTRO_OFFER.packageKey },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.url) window.location.href = data.url;
    } else {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { priceId: INTRO_OFFER.stripePriceId, currency: "USD" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      if (data?.url) window.location.href = data.url;
    }
  };

  return { eligible, isNigeria, startCheckout, refetch };
};
