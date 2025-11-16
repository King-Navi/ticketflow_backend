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
    let charge;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        charge = event.data.object;
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
                // 200 para que Stripe no reintente,
                // pero dejamos log para revisarlo.
                return res.status(200).json({ error: "failed to finalize but give you 200 only if you re stripe" });
            }
        }

        case "payment_intent.payment_failed": {
            //liberar la reserva?
            //¿EScribir que el pago fallo?
            return res.status(200).json({ received: true });
        }
        case "charge.refunded": {
            /*TODO:

            Se dispara cuando la charge asociada a un PaymentIntent
            pasa a tener al menos un reembolso (refund) aplicado.
            Normalmente lo verás:
            cuando el refund se completa (especialmente en reembolsos totales).
            o cuando cambia el estado global de la charge respecto a reembolsos.

            En nuestro diseño, el flujo principal de negocio del refund lo
            llevamos en refundTicketService (cuando NOSOTROS llamamos a stripe.refunds.create).

            lo podemos usar para:
                Auditoría / logs.
                Reconciliación de totales reembolsados a nivel de charge.
                Detectar reembolsos hechos fuera de nuestra API (Dashboard),
                pero para actuar de verdad es mejor usar charge.refund.updated, que trae el refund en sí.
            */
            console.log("Stripe refund webhook received:", {
                chargeId: charge.id,
                paymentIntentId: charge.payment_intent,
                amountRefunded: charge.amount_refunded,
                refunds: charge.refunds,
            });
            const charge = event.data.object;
            if (process.env.DEBUG === "true") {
                console.log("Stripe refund webhook received:", {
                    chargeId: charge.id,
                    paymentIntentId: charge.payment_intent,
                    amountRefunded: charge.amount_refunded,
                    refunds: charge.refunds,
                });
            }

            
            // TODO :
            // - Verificar que el total amount_refunded coincide con lo que crees en tu BD.
            // - Disparar algún proceso de reconciliación asíncrono si detectas diferencias.
            // - NO deberia ser necesario cambiar estados de tickets aquí
            //   ya se maneja en refundTicketService / charge.refund.updated.

            return res.status(200).json({ received: true });
        }
        case "charge.refund.updated": {
            //TODO: revisar que todo OK
            console.log("Stripe refund webhook updated:", {
                chargeId: charge.id,
                paymentIntentId: charge.payment_intent,
                amountRefunded: charge.amount_refunded,
                refunds: charge.refunds,
            });
            // TODO:
            // - Buscar payment por paymentIntentId.
            // - Buscar/crear refundRow por refund.id.
            // - Mapear refund.status -> REFUND_STATUS.*
            // - Actualizar ticket_status a REFUNDED cuando corresponda.
            // - Asegurar idempotencia.
        }

        default:
            return res.status(200).json({ received: true });
    }
}
