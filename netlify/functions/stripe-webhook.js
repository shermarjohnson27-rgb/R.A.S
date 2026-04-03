const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
  };

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    if (webhookSecret && sig) {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } else {
      // For testing without webhook secret
      stripeEvent = JSON.parse(event.body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, headers, body: `Webhook Error: ${err.message}` };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      console.log("✅ Checkout completed:", {
        customer: session.customer,
        subscription: session.subscription,
        email: session.customer_email || session.customer_details?.email,
        plan: session.metadata?.plan || session.subscription_data?.metadata?.plan,
      });
      // TODO: Update user's plan in your database (Supabase)
      // await supabase.from('users').update({ plan: session.metadata.plan, stripe_customer_id: session.customer, stripe_subscription_id: session.subscription }).eq('email', session.customer_email)
      break;
    }

    case "customer.subscription.created": {
      const subscription = stripeEvent.data.object;
      console.log("🆕 Subscription created:", {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        plan: subscription.metadata?.plan,
        trial_end: subscription.trial_end,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = stripeEvent.data.object;
      console.log("🔄 Subscription updated:", {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.metadata?.plan,
        cancel_at_period_end: subscription.cancel_at_period_end,
      });
      // Handle plan changes, trial ending, etc.
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = stripeEvent.data.object;
      console.log("❌ Subscription cancelled:", {
        id: subscription.id,
        customer: subscription.customer,
      });
      // TODO: Downgrade user to free plan in database
      // await supabase.from('users').update({ plan: 'free', stripe_subscription_id: null }).eq('stripe_subscription_id', subscription.id)
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = stripeEvent.data.object;
      console.log("💰 Payment succeeded:", {
        customer: invoice.customer,
        amount: invoice.amount_paid / 100,
        subscription: invoice.subscription,
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = stripeEvent.data.object;
      console.log("⚠️ Payment failed:", {
        customer: invoice.customer,
        subscription: invoice.subscription,
        attempt: invoice.attempt_count,
      });
      // TODO: Send dunning email, notify user
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true }),
  };
};
