import Stripe from "stripe";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for webhook verification
  },
};

async function buffer(readable: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await buffer(req.body as ReadableStream<Uint8Array>);
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const plan = session.metadata?.plan;
  const customerId = session.customer as string;

  if (!userId) {
    console.error("No userId found in checkout session");
    return;
  }

  const subRef = db.collection("subscriptions").doc(userId);

  if (session.mode === "payment") {
    // One-time payment (Infinite plan)
    await subRef.set(
      {
        tier: "infinite",
        startDate: new Date().toISOString(),
        stripeCustomerId: customerId,
        trialUsed: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`User ${userId} upgraded to Infinite (lifetime)`);
  } else if (session.mode === "subscription") {
    // Subscription payment (Pro plan)
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    await subRef.set(
      {
        tier: "pro",
        startDate: new Date().toISOString(),
        endDate: new Date(subscription.current_period_end * 1000).toISOString(),
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        trialUsed: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`User ${userId} subscribed to Pro (${plan})`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by customer ID
    const snapshot = await db
      .collection("subscriptions")
      .where("stripeCustomerId", "==", subscription.customer)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.error("No user found for subscription:", subscription.id);
      return;
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      endDate: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const subRef = db.collection("subscriptions").doc(userId);

  await subRef.update({
    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  let docRef;

  if (userId) {
    docRef = db.collection("subscriptions").doc(userId);
  } else {
    // Try to find user by customer ID
    const snapshot = await db
      .collection("subscriptions")
      .where("stripeCustomerId", "==", subscription.customer)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.error(
        "No user found for canceled subscription:",
        subscription.id
      );
      return;
    }

    docRef = snapshot.docs[0].ref;
  }

  await docRef.update({
    tier: "free",
    stripeSubscriptionId: null,
    endDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`Subscription canceled, user downgraded to free`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  const subRef = db.collection("subscriptions").doc(userId);

  await subRef.update({
    tier: "pro",
    endDate: new Date(subscription.current_period_end * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`Invoice paid, subscription renewed for user ${userId}`);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // You might want to send an email notification here
  console.log(`Invoice payment failed for user ${userId}`);
}
