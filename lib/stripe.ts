import Stripe from 'stripe';
import { logInfo } from './logger';

if (!process.env.STRIPE_SECRET_KEY) {
  logInfo('[stripe] STRIPE_SECRET_KEY absent — fonctionnalités Stripe désactivées', {});
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null;
