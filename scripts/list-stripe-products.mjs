#!/usr/bin/env node

import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_51T5Rf0EGL7Xs9cUTfHFxTR4eQSG74G28ezGtdcKCjSEP14iwWxATTAu4MWa3QnRIQzcgVM9WZ663cFOS5OxeJGnh00J5HdV8n8";

const stripe = new Stripe(apiKey);

async function listProducts() {
  try {
    console.log("Listando todos los productos en Stripe...\n");

    const products = await stripe.products.list({
      limit: 100,
    });

    if (products.data.length === 0) {
      console.log("No hay productos en esta cuenta de Stripe");
      return;
    }

    console.log(`Total de productos: ${products.data.length}\n`);

    for (const product of products.data) {
      console.log(`Producto: ${product.name}`);
      console.log(`ID: ${product.id}`);
      console.log(`Activo: ${product.active}`);

      // Obtener precios del producto
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      if (prices.data.length > 0) {
        console.log(`Precios:`);
        for (const price of prices.data) {
          const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : "variable";
          const currency = price.currency.toUpperCase();
          const recurring = price.recurring ? ` (${price.recurring.interval})` : "";
          console.log(`  - ${currency} ${amount}${recurring} (${price.id}) - Activo: ${price.active}`);
        }
      } else {
        console.log("Sin precios");
      }
      console.log("");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

listProducts();
