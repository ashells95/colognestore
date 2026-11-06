const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema } = require('../validators/auth');
const {
  productQuerySchema,
  productSchema,
  productUpdateSchema,
} = require('../validators/products');

test('registration normalizes email and rejects caller-supplied roles', () => {
  const parsed = registerSchema.safeParse({
    name: 'Customer',
    email: ' CUSTOMER@example.com ',
    password: 'a-secure-password',
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, 'customer@example.com');
  assert.equal(
    registerSchema.safeParse({
      name: 'Customer',
      email: 'customer@example.com',
      password: 'a-secure-password',
      role: 'admin',
    }).success,
    false,
  );
});

test('product queries apply safe defaults and reject inverted price ranges', () => {
  const parsed = productQuerySchema.safeParse({});
  assert.equal(parsed.success, true);
  assert.deepEqual(
    { page: parsed.data.page, limit: parsed.data.limit, sort: parsed.data.sort },
    { page: 1, limit: 12, sort: 'newest' },
  );

  assert.equal(
    productQuerySchema.safeParse({ minPriceCents: '5000', maxPriceCents: '1000' }).success,
    false,
  );
});

test('product updates must include at least one supported field', () => {
  assert.equal(productUpdateSchema.safeParse({}).success, false);
  const parsed = productUpdateSchema.safeParse({ active: false });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, { active: false });
  assert.equal(productUpdateSchema.safeParse({ role: 'admin' }).success, false);
});

test('product images accept safe local storefront assets and HTTPS URLs only', () => {
  const product = {
    name: 'Evening Ember',
    slug: 'evening-ember',
    brand: 'Atelier North',
    description: 'A warm, woody fragrance.',
    gender: 'unisex',
    fragranceFamily: 'Woody',
    variants: [{
      sku: 'EE-50-EDP',
      sizeMl: 50,
      concentration: 'EDP',
      priceCents: 12500,
      stock: 5,
    }],
  };

  assert.equal(
    productSchema.safeParse({
      ...product,
      images: [{ url: '/images/products/evening-ember.webp', altText: 'Amber bottle' }],
    }).success,
    true,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      images: [{ url: 'https://images.example.com/ember.jpg', altText: 'Amber bottle' }],
    }).success,
    true,
  );

  for (const url of [
    'http://images.example.com/ember.jpg',
    '//images.example.com/ember.jpg',
    '/images/products/../private.webp',
    '/api/health',
  ]) {
    assert.equal(
      productSchema.safeParse({
        ...product,
        images: [{ url, altText: 'Invalid image' }],
      }).success,
      false,
      `Expected ${url} to be rejected`,
    );
  }
});
