const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // CORS headers
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
    const { priceId, planName, customerEmail, customerName, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!priceId || !customerEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing priceId or customerEmail" }),
      };
    }

    // Check if customer already exists in Stripe
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      // Update name if provided
      if (customerName) {
        await stripe.customers.update(customer.id, { name: customerName });
      }
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || undefined,
        metadata: { plan: planName || "unknown" },
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan: planName },
      },
      success_url: successUrl || `${event.headers.origin || "https://your-ras-app.netlify.app"}?checkout=success&plan=${planName}`,
      cancel_url: cancelUrl || `${event.headers.origin || "https://your-ras-app.netlify.app"}?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    };
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
