// Stripe integration service
// Uses Stripe Checkout for payments

// Price IDs from Stripe Dashboard (you'll set these in .env)
const STRIPE_PRICES = {
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || "",
  pro_yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || "",
  infinite: import.meta.env.VITE_STRIPE_INFINITE_PRICE_ID || "",
};

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";

// API endpoint for Stripe operations (your serverless function)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type PlanType = "pro_monthly" | "pro_yearly" | "infinite";

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface CustomerPortalResponse {
  url: string;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export const createCheckoutSession = async (
  userId: string,
  userEmail: string,
  plan: PlanType
): Promise<CheckoutSessionResponse> => {
  const priceId = STRIPE_PRICES[plan];

  if (!priceId) {
    throw new Error(`Price ID not configured for plan: ${plan}`);
  }

  if (!API_BASE_URL) {
    throw new Error("API base URL not configured");
  }

  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userEmail,
      priceId,
      plan,
      successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/settings`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create checkout session");
  }

  return response.json();
};

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export const createCustomerPortalSession = async (
  userId: string
): Promise<CustomerPortalResponse> => {
  if (!API_BASE_URL) {
    throw new Error("API base URL not configured");
  }

  const response = await fetch(`${API_BASE_URL}/create-portal-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      returnUrl: `${window.location.origin}/settings`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create portal session");
  }

  return response.json();
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (
  userId: string,
  userEmail: string,
  plan: PlanType
): Promise<void> => {
  try {
    const { url } = await createCheckoutSession(userId, userEmail, plan);
    window.location.href = url;
  } catch (error) {
    console.error("Error redirecting to checkout:", error);
    throw error;
  }
};

/**
 * Redirect to Stripe Customer Portal
 */
export const redirectToCustomerPortal = async (
  userId: string
): Promise<void> => {
  try {
    const { url } = await createCustomerPortalSession(userId);
    window.location.href = url;
  } catch (error) {
    console.error("Error redirecting to portal:", error);
    throw error;
  }
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!(
    STRIPE_PUBLIC_KEY &&
    API_BASE_URL &&
    (STRIPE_PRICES.pro_monthly ||
      STRIPE_PRICES.pro_yearly ||
      STRIPE_PRICES.infinite)
  );
};

/**
 * Get pricing display info
 */
export const getPricingInfo = () => ({
  pro_monthly: {
    price: "$4.99",
    period: "/month",
    description: "Billed monthly",
  },
  pro_yearly: {
    price: "$39.99",
    period: "/year",
    description: "Save 33% - billed annually",
    savings: "$19.89/year",
  },
  infinite: {
    price: "$79.99",
    period: "one-time",
    description: "Lifetime access - pay once, own forever",
  },
});
