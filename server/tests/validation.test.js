const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema } = require('../validators/auth');
const { productQuerySchema, productUpdateSchema } = require('../validators/products');

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
