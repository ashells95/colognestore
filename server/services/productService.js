const Product = require('../models/Product');

const sortFields = {
  newest: { createdAt: -1 },
  'price-asc': { minPriceCents: 1, _id: 1 },
  'price-desc': { minPriceCents: -1, _id: 1 },
  'name-asc': { name: 1, _id: 1 },
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildProductFilter(query, { includeInactive = false } = {}) {
  const filter = {};
  if (!includeInactive) {
    filter.active = true;
  }

  if (query.brand) {
    filter.brand = new RegExp(`^${escapeRegex(query.brand)}$`, 'i');
  }
  if (query.gender) filter.gender = query.gender;
  if (query.fragranceFamily) {
    filter.fragranceFamily = new RegExp(`^${escapeRegex(query.fragranceFamily)}$`, 'i');
  }
  if (query.featured !== undefined) filter.featured = query.featured === 'true';
  if (query.q) {
    const search = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [
      { name: search },
      { brand: search },
      { fragranceFamily: search },
      { topNotes: search },
      { heartNotes: search },
      { baseNotes: search },
    ];
  }

  const variantFilter = {};
  if (query.concentration) variantFilter.concentration = query.concentration;
  if (query.sizeMl !== undefined) variantFilter.sizeMl = query.sizeMl;
  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    variantFilter.priceCents = {};
    if (query.minPriceCents !== undefined) {
      variantFilter.priceCents.$gte = query.minPriceCents;
    }
    if (query.maxPriceCents !== undefined) {
      variantFilter.priceCents.$lte = query.maxPriceCents;
    }
  }
  if (query.inStock === 'true') variantFilter.stock = { $gt: 0 };
  if (query.inStock === 'false') variantFilter.stock = 0;
  if (Object.keys(variantFilter).length > 0) {
    filter.variants = { $elemMatch: variantFilter };
  }

  return filter;
}

async function listProducts(query, options = {}) {
  const filter = buildProductFilter(query, options);
  const skip = (query.page - 1) * query.limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortFields[query.sort])
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function calculatePriceRange(variants) {
  const prices = variants.map((variant) => variant.priceCents);
  return {
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
  };
}

module.exports = { buildProductFilter, calculatePriceRange, listProducts, slugify };
