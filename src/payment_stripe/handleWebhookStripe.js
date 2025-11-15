import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { finalizeTicketPurchaseFromStripe } from "../service/ticket.service.js"
let stripe;
let endpointSecret;

if (process.env.DEBUG === "true") {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY_DEV);
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV;
} else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
}
export async function handleStripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        if (process.env.DEBUG === "true") {
            console.error(" Webhook signature verification failed.", err.message);
        }
        return res.status(400).send(`Webhook Error`);
    }


    //Cuiado con status != 200 ya que stripe reintentara el pago
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata || {};
            if (process.env.DEBUG === "true") {
                console.log(metadata);
            }
            // example:
            // metadata.attendee_id
            // metadata.event_id
            // metadata.seat_ids -> "12,13,14"
            // metadata.subtotal
            // metadata.tax_amount

            try {
                await finalizeTicketPurchaseFromStripe(paymentIntent);
                return res.status(200).json({ received: true });
            } catch (err) {
                if (process.env.DEBUG === "true") {
                    console.error("Error while finalizing purchase:", err);
                }
                // responde 200 para que puedas revisar logs 
                return res.status(200).json({ error: "failed to finalize but give you 200 only if you re stripe" });
            }
        }

        case "payment_intent.payment_failed": {
            //liberar la reserva?
            //¿EScribir que el pago fallo?
            return res.status(200).json({ received: true });
        }

        default:
            return res.status(200).json({ received: true });
    }
}
