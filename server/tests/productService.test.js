const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProductFilter } = require('../services/productService');
const { productQuerySchema } = require('../validators/products');

test('catalog filters constrain one matching variant and escape search patterns', () => {
  const query = productQuerySchema.parse({
    q: '[untrusted.*]',
    brand: 'Atelier.*',
    concentration: 'EDP',
    sizeMl: '50',
    minPriceCents: '10000',
    maxPriceCents: '20000',
    inStock: 'true',
  });
  const filter = buildProductFilter(query);

  assert.equal(filter.active, true);
  assert.equal(filter.brand.source, '^Atelier\\.\\*$');
  assert.deepEqual(filter.variants, {
    $elemMatch: {
      concentration: 'EDP',
      sizeMl: 50,
      priceCents: { $gte: 10000, $lte: 20000 },
      stock: { $gt: 0 },
    },
  });
  assert.equal(filter.$or[0].name.source, '\\[untrusted\\.\\*\\]');
});
