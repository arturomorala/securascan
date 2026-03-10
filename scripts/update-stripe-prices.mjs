#!/usr/bin/env node

import Stripe from "stripe";

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_51T5Rf0EGL7Xs9cUTfHFxTR4eQSG74G28ezGtdcKCjSEP14iwWxATTAu4MWa3QnRIQzcgVM9WZ663cFOS5OxeJGnh00J5HdV8n8";

if (!apiKey) {
  console.error("Error: STRIPE_SECRET_KEY no esta configurada");
  process.exit(1);
}

const stripe = new Stripe(apiKey);

async function updatePricesToZero() {
  try {
    console.log("Buscando todos los productos de SecuraScan...");
    console.log(`Usando API Key: ${apiKey.substring(0, 20)}...\n`);

    // Obtener todos los productos
    const products = await stripe.products.list({
      limit: 100,
    });

    const securascanProducts = products.data.filter((p) =>
      p.name.toLowerCase().includes("securascan")
    );

    if (securascanProducts.length === 0) {
      console.log("No se encontraron productos de SecuraScan");
      return;
    }

    console.log(`Se encontraron ${securascanProducts.length} productos de SecuraScan\n`);

    for (const product of securascanProducts) {
      console.log(`Producto: ${product.name} (${product.id})`);

      // Obtener todos los precios del producto
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      if (prices.data.length === 0) {
        console.log("   No tiene precios asociados\n");
        continue;
      }

      for (const price of prices.data) {
        // Solo actualizar precios activos
        if (price.active) {
          const currentAmount = price.unit_amount ? price.unit_amount / 100 : "variable";
          console.log(
            `   Precio actual: EUR ${currentAmount} (${price.id})`
          );

          // Crear nuevo precio a 0 EUR
          const newPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: 0, // 0 centavos = 0 EUR
            currency: "eur",
            recurring: price.recurring ? {
              interval: price.recurring.interval,
              interval_count: price.recurring.interval_count,
            } : undefined,
          });

          console.log(`   Nuevo precio creado: EUR 0.00 (${newPrice.id})`);

          // Desactivar el precio anterior
          try {
            await stripe.prices.update(price.id, {
              active: false,
            });
            console.log(`   Precio anterior desactivado\n`);
          } catch (e) {
            console.log(`   No se pudo desactivar el precio anterior (puede estar en uso)\n`);
          }
        }
      }
    }

    console.log("Todos los precios han sido actualizados a 0 EUR!");
    console.log("\nProximos pasos:");
    console.log("1. Ve a tu dashboard de Stripe");
    console.log("2. Verifica que los nuevos precios aparezcan en cada producto");
    console.log("3. Actualiza tu aplicacion para usar los nuevos price IDs si es necesario");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

updatePricesToZero();
