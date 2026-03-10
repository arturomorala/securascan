#!/usr/bin/env node

import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_51T5Rf0EGL7Xs9cUTfHFxTR4eQSG74G28ezGtdcKCjSEP14iwWxATTAu4MWa3QnRIQzcgVM9WZ663cFOS5OxeJGnh00J5HdV8n8";

const stripe = new Stripe(apiKey);

// Precios a actualizar (obtenidos del script anterior)
const pricesToUpdate = [
  { id: "price_1T5S6lEGL7Xs9cUT7CMj7TeZ", name: "Plan Premium (EUR 15.00)" },
  { id: "price_1T5S4lEGL7Xs9cUTwQhfP8Ch", name: "Plan Pro (EUR 10.00)" },
  { id: "price_1T5S3zEGL7Xs9cUTf0JmKzKR", name: "Plan Basico (EUR 5.00)" },
];

async function updatePricesToZero() {
  try {
    console.log("Actualizando precios a 0 EUR...\n");

    for (const priceInfo of pricesToUpdate) {
      try {
        // Obtener el precio actual para saber el producto
        const price = await stripe.prices.retrieve(priceInfo.id);
        
        console.log(`Actualizando: ${priceInfo.name}`);
        console.log(`  ID: ${priceInfo.id}`);

        // Crear nuevo precio a 0 EUR
        const newPrice = await stripe.prices.create({
          product: price.product,
          unit_amount: 0, // 0 centavos = 0 EUR
          currency: "eur",
          recurring: price.recurring ? {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          } : undefined,
        });

        console.log(`  Nuevo precio creado: EUR 0.00 (${newPrice.id})`);

        // Desactivar el precio anterior
        await stripe.prices.update(priceInfo.id, {
          active: false,
        });

        console.log(`  Precio anterior desactivado\n`);
      } catch (error) {
        console.error(`  Error actualizando ${priceInfo.name}: ${error.message}\n`);
      }
    }

    console.log("Todos los precios han sido actualizados a 0 EUR!");
    console.log("\nProximos pasos:");
    console.log("1. Ve a tu dashboard de Stripe para verificar los nuevos precios");
    console.log("2. Copia los nuevos price IDs si necesitas actualizarlos en tu aplicacion");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

updatePricesToZero();
