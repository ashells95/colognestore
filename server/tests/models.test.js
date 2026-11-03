const test = require('node:test');
const assert = require('node:assert/strict');
const Product = require('../models/Product');
const User = require('../models/User');

const productData = {
  name: 'Evening Ember',
  slug: 'evening-ember',
  brand: 'Atelier North',
  description: 'A warm, woody fragrance.',
  gender: 'unisex',
  fragranceFamily: 'Woody',
  variants: [
    {
      sku: 'EE-50-EDP',
      sizeMl: 50,
      concentration: 'EDP',
      priceCents: 12500,
      stock: 5,
    },
  ],
};

test('product model calculates price bounds and rejects duplicate variant SKUs', async () => {
  const product = new Product(productData);
  await product.validate();
  assert.equal(product.minPriceCents, 12500);
  assert.equal(product.maxPriceCents, 12500);

  const duplicateSkus = new Product({
    ...productData,
    variants: [...productData.variants, { ...productData.variants[0], sizeMl: 100 }],
  });
  await assert.rejects(duplicateSkus.validate(), /Variant SKUs must be unique/);
});

test('user password hashes are excluded from default database selection and JSON output', () => {
  assert.equal(User.schema.path('passwordHash').options.select, false);

  const user = new User({
    name: 'Customer',
    email: 'customer@example.com',
    passwordHash: 'stored-hash',
  });

  assert.equal(user.toJSON().passwordHash, undefined);
  assert.equal(user.role, 'customer');
});
