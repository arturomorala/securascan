/**
 * Stripe Products and Prices Configuration
 * This file defines all products and prices for SecuraScan
 */

export const STRIPE_PRODUCTS = {
  ONE_TIME_SCAN: {
    name: "One-Time Scan",
    description: "Single website security scan with detailed vulnerability report",
    priceInCents: 499, // 4.99 EUR
    currency: "eur",
    type: "one_time",
  },
  PRO_MONTHLY: {
    name: "Pro Plan",
    description: "Professional security monitoring with monthly subscription",
    priceInCents: 2999, // 29.99 EUR
    currency: "eur",
    type: "recurring",
    interval: "month",
  },
  BUSINESS_MONTHLY: {
    name: "Business Plan",
    description: "Enterprise security monitoring with advanced features",
    priceInCents: 7999, // 79.99 EUR
    currency: "eur",
    type: "recurring",
    interval: "month",
  },
};

export const PLAN_MAPPING = {
  one_time_scan: "basic",
  pro: "professional",
  business: "enterprise",
};

export const PRICE_MAPPING = {
  // Map Stripe price IDs to plan names (will be populated after creating prices in Stripe)
  // Example: "price_1234567890": "pro"
};
