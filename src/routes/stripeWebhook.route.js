import { Router } from "express";
import bodyParser from "body-parser";
import { handleStripeWebhook } from "../payment_stripe/handleWebhookStripe.js"

const WEBHOOK_ROUTE = "/v1/stripe";
const router = Router();

router.post(
    `${WEBHOOK_ROUTE}/webhooks/stripe`,
    bodyParser.raw({ type: "application/json" }),
    handleStripeWebhook
);

export default router;




