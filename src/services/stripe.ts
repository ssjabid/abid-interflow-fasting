// Stripe integration service
// Uses Stripe Checkout for payments

// API endpoint for Stripe operations (your serverless function)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type PlanType = "pro_monthly" | "infinite";

export interface CheckoutSessionResponse {
  url: string;
}

/**
 * Create a Stripe Checkout session and redirect
 */
export const redirectToCheckout = async (
  userId: string,
  userEmail: string,
  plan: PlanType
): Promise<void> => {
  if (!API_BASE_URL) {
    throw new Error("Payment system not configured. Please try again later.");
  }

  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userEmail,
      plan,
      successUrl: `${window.location.origin}/?payment=success&plan=${plan}`,
      cancelUrl: `${window.location.origin}/?payment=cancelled`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create checkout session");
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error("No checkout URL received");
  }

  window.location.href = url;
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!API_BASE_URL;
};

/**
 * Get pricing display info (in GBP)
 */
export const getPricingInfo = () => ({
  pro_monthly: {
    price: "£5",
    period: "/month",
    description: "Billed monthly",
  },
  infinite: {
    price: "£60",
    period: "one-time",
    description: "Lifetime access - pay once, own forever",
  },
});
