require('dotenv').config();

if (process.env.SEED_DEMO_DATA !== 'true') {
  throw new Error('Set SEED_DEMO_DATA=true to insert clearly labeled sample products.');
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('Sample products cannot be seeded when NODE_ENV is production.');
}

const mongoose = require('mongoose');
const Product = require('../models/Product');
const { connectToDatabase } = require('../config/database');
const { mongoUri } = require('../config/env');

const sampleProducts = [
  {
    name: 'SAMPLE — Cedar After Rain',
    slug: 'sample-cedar-after-rain',
    brand: 'CologneStore Sample Studio',
    description: 'DEVELOPMENT SAMPLE — A fictional study in damp cedar, green leaves, and cool mineral air. Not a real retail product.',
    gender: 'unisex',
    fragranceFamily: 'Woody',
    topNotes: ['Bergamot', 'Green leaf'],
    heartNotes: ['Rain accord', 'Cypress'],
    baseNotes: ['Cedarwood', 'Soft musk'],
    characteristics: ['woody', 'fresh', 'musk'],
    images: [],
    variants: [
      { sku: 'SAMPLE-CEDAR-30-EDP', sizeMl: 30, concentration: 'EDP', priceCents: 6800, stock: 12 },
      { sku: 'SAMPLE-CEDAR-75-EDP', sizeMl: 75, concentration: 'EDP', priceCents: 11800, stock: 8 },
    ],
    featured: true,
    active: true,
  },
  {
    name: 'SAMPLE — Saffron Nocturne',
    slug: 'sample-saffron-nocturne',
    brand: 'CologneStore Sample Studio',
    description: 'DEVELOPMENT SAMPLE — A fictional evening blend of saffron, amber, and smooth woods. Not a real retail product.',
    gender: 'unisex',
    fragranceFamily: 'Amber',
    topNotes: ['Saffron', 'Pink pepper'],
    heartNotes: ['Iris', 'Amber'],
    baseNotes: ['Sandalwood', 'Vanilla'],
    characteristics: ['amber', 'spicy', 'woody'],
    images: [],
    variants: [
      { sku: 'SAMPLE-SAFFRON-50-PARFUM', sizeMl: 50, concentration: 'Parfum', priceCents: 14200, stock: 6 },
      { sku: 'SAMPLE-SAFFRON-100-PARFUM', sizeMl: 100, concentration: 'Parfum', priceCents: 21800, stock: 4 },
    ],
    featured: true,
    active: true,
  },
  {
    name: 'SAMPLE — Neroli in Bloom',
    slug: 'sample-neroli-in-bloom',
    brand: 'CologneStore Sample Studio',
    description: 'DEVELOPMENT SAMPLE — A fictional bright floral with neroli, orange blossom, and clean musk. Not a real retail product.',
    gender: 'women',
    fragranceFamily: 'Floral',
    topNotes: ['Neroli', 'Mandarin'],
    heartNotes: ['Orange blossom', 'Jasmine'],
    baseNotes: ['White musk', 'Blonde woods'],
    characteristics: ['floral', 'citrus', 'fresh'],
    images: [],
    variants: [
      { sku: 'SAMPLE-NEROLI-30-EDT', sizeMl: 30, concentration: 'EDT', priceCents: 5900, stock: 10 },
      { sku: 'SAMPLE-NEROLI-60-EDT', sizeMl: 60, concentration: 'EDT', priceCents: 9400, stock: 7 },
    ],
    featured: false,
    active: true,
  },
];

async function seedProducts() {
  await connectToDatabase(mongoUri);

  let inserted = 0;
  let skipped = 0;

  for (const productData of sampleProducts) {
    const skus = productData.variants.map(({ sku }) => sku);
    const existing = await Product.findOne({
      $or: [
        { slug: productData.slug },
        { 'variants.sku': { $in: skus } },
      ],
    })
      .select('_id')
      .lean();

    if (existing) {
      skipped += 1;
      console.log(`Skipped existing sample or SKU conflict: ${productData.slug}.`);
      continue;
    }

    await Product.create(productData);
    inserted += 1;
    console.log(`Inserted ${productData.slug}.`);
  }

  console.log(`Sample seed complete: ${inserted} inserted, ${skipped} skipped.`);
}

seedProducts()
  .catch((error) => {
    console.error('Sample product seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
