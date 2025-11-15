import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Missing STRIPE_SECRET_KEY env variable.");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20", 
});

const seats = [
  { event_seat_id: 101, base_price: 500.0 },
  { event_seat_id: 102, base_price: 500.0 },
];

const attendee_id = 1;
const eventId = 10;
const TAX_PERCENTAGE = 16;

function computeTotals(seats, taxPercentage) {
  const subtotal = seats
    .map((s) => Number(s.base_price))
    .reduce((acc, n) => acc + n, 0);

  const taxAmountRaw = subtotal * (taxPercentage / 100);
  const tax_amount = Number(taxAmountRaw.toFixed(2));
  const total_amount = Number((subtotal + tax_amount).toFixed(2));

  return { subtotal, tax_amount, total_amount };
}

async function main() {
  try {
    const { subtotal, tax_amount, total_amount } = computeTotals(
      seats,
      TAX_PERCENTAGE
    );

    console.log("Subtotal:", subtotal);
    console.log("Tax (%):", TAX_PERCENTAGE);
    console.log("Tax amount:", tax_amount);
    console.log("Total amount:", total_amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total_amount * 100),
      currency: "mxn",
      metadata: {
        attendee_id: String(attendee_id),
        event_id: String(eventId),
        seat_ids: seats.map((s) => s.event_seat_id).join(","),
        subtotal: subtotal.toFixed(2),
        tax_amount: tax_amount.toFixed(2),
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    console.log("=== PaymentIntent created ===");
    console.log("ID:", paymentIntent.id);
    console.log("Client secret:", paymentIntent.client_secret);
    console.log("Status:", paymentIntent.status);
  } catch (err) {
    console.error("Error creating PaymentIntent:", err);
  }
}

main();
