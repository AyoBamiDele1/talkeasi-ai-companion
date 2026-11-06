// First-purchase welcome offer: 60 credits (1 hour) at a discount.
// Nigeria pays in NGN via Paystack; everyone else pays USD via Stripe.
export const INTRO_OFFER = {
  packageKey: "intro",
  credits: 60,
  talkTime: "1 Hour",
  stripePriceId: "price_1UYssX2dz9WA913sq7Bx37Ej",
  priceNGN: 500,
  regularNGN: 700,
  priceUSD: 0.99,
  regularUSD: 1.99,
} as const;

export const formatIntroPrices = (isNigeria: boolean) =>
  isNigeria
    ? { price: `₦${INTRO_OFFER.priceNGN}`, regular: `₦${INTRO_OFFER.regularNGN}` }
    : { price: `$${INTRO_OFFER.priceUSD}`, regular: `$${INTRO_OFFER.regularUSD}` };
