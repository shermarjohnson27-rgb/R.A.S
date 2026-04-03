const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { action, customerEmail, subscriptionId } = JSON.parse(event.body);

    // ─── GET SUBSCRIPTION STATUS ───
    if (action === "status") {
      if (!customerEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing customerEmail" }) };
      }

      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ plan: "free", status: "no_customer", subscription: null }),
        };
      }

      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ plan: "free", status: "no_subscription", customerId: customer.id }),
        };
      }

      const sub = subscriptions.data[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          plan: sub.metadata?.plan || "unknown",
          status: sub.status,
          subscriptionId: sub.id,
          customerId: customer.id,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          trialEnd: sub.trial_end,
          card: sub.default_payment_method ? {
            last4: "••••",
            brand: "card",
          } : null,
        }),
      };
    }

    // ─── CANCEL SUBSCRIPTION ───
    if (action === "cancel") {
      if (!subscriptionId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing subscriptionId" }) };
      }

      // Cancel at end of billing period (graceful)
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "cancelling",
          cancelAt: subscription.cancel_at,
          currentPeriodEnd: subscription.current_period_end,
        }),
      };
    }

    // ─── REACTIVATE SUBSCRIPTION ───
    if (action === "reactivate") {
      if (!subscriptionId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing subscriptionId" }) };
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: subscription.status,
          plan: subscription.metadata?.plan,
        }),
      };
    }

    // ─── CREATE CUSTOMER PORTAL SESSION ───
    if (action === "portal") {
      if (!customerEmail) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing customerEmail" }) };
      }

      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Customer not found" }) };
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: event.headers.origin || "https://your-ras-app.netlify.app",
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: portalSession.url }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid action" }) };
  } catch (error) {
    console.error("Subscription management error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
