import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, userEmail, plan, successUrl, cancelUrl } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Price IDs from Stripe Dashboard
    const priceIds: Record<string, string> = {
      pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      infinite: process.env.STRIPE_INFINITE_PRICE_ID!,
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const isSubscription = plan === "pro_monthly";

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=success`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?payment=cancelled`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return res.status(500).json({ error: error.message });
  }
}
