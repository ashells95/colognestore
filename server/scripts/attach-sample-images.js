require('dotenv').config();

if (process.env.SEED_DEMO_DATA !== 'true') {
  throw new Error('Set SEED_DEMO_DATA=true to attach images to sample products.');
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('Sample product images cannot be attached when NODE_ENV is production.');
}

const mongoose = require('mongoose');
const Product = require('../models/Product');
const { connectToDatabase } = require('../config/database');
const { mongoUri } = require('../config/env');

const sampleImages = [
  {
    slug: 'sample-cedar-after-rain',
    image: {
      url: '/images/products/cedar-after-rain.webp',
      altText: 'Amber glass fragrance bottle on a rain-darkened cedar block among green leaves.',
    },
  },
  {
    slug: 'sample-saffron-nocturne',
    image: {
      url: '/images/products/saffron-nocturne.webp',
      altText: 'Deep burgundy fragrance bottle with a gold cap among amber resin and saffron.',
    },
  },
  {
    slug: 'sample-neroli-in-bloom',
    image: {
      url: '/images/products/neroli-in-bloom.webp',
      altText: 'Pale blush fragrance bottle among white orange blossoms and green citrus.',
    },
  },
];

async function attachSampleImages() {
  await connectToDatabase(mongoUri);

  let attached = 0;
  let skipped = 0;

  for (const { slug, image } of sampleImages) {
    const result = await Product.updateOne(
      { slug, images: { $size: 0 } },
      { $set: { images: [image] } },
      { runValidators: true },
    );

    if (result.modifiedCount === 1) {
      attached += 1;
      console.log(`Attached a storefront image to ${slug}.`);
    } else {
      skipped += 1;
      console.log(`Skipped ${slug}; it is missing or already has images.`);
    }
  }

  console.log(`Sample image attachment complete: ${attached} attached, ${skipped} skipped.`);
}

attachSampleImages()
  .catch((error) => {
    console.error('Sample image attachment failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
