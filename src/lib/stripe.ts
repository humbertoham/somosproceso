import "server-only";

import Stripe from "stripe";

import { getStripeEnv } from "@/lib/env";

let instance: Stripe | undefined;
export function getStripe() {
  instance ??= new Stripe(getStripeEnv().STRIPE_SECRET_KEY);
  return instance;
}
