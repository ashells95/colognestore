const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    altText: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 64 },
    sizeMl: { type: Number, required: true, min: 1 },
    concentration: {
      type: String,
      required: true,
      enum: ['EDT', 'EDP', 'Parfum', 'Elixir'],
    },
    priceCents: { type: Number, required: true, min: 1 },
    compareAtPriceCents: { type: Number, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    brand: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    gender: { type: String, enum: ['men', 'women', 'unisex'], required: true },
    fragranceFamily: { type: String, required: true, trim: true, maxlength: 60 },
    topNotes: { type: [String], default: [] },
    heartNotes: { type: [String], default: [] },
    baseNotes: { type: [String], default: [] },
    characteristics: {
      type: [String],
      enum: ['fresh', 'woody', 'spicy', 'sweet', 'floral', 'amber', 'citrus', 'musk'],
      default: [],
    },
    images: { type: [imageSchema], default: [] },
    variants: { type: [variantSchema], required: true, validate: [(items) => items.length > 0, 'At least one variant is required.'] },
    minPriceCents: { type: Number, required: true, min: 1 },
    maxPriceCents: { type: Number, required: true, min: 1 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ 'variants.sku': 1 }, { unique: true });
productSchema.index({ active: 1, featured: 1, createdAt: -1 });
productSchema.index({ active: 1, gender: 1, fragranceFamily: 1 });

productSchema.pre('validate', function setPriceRange() {
  if (this.variants.length > 0) {
    const prices = this.variants.map((variant) => variant.priceCents);
    this.minPriceCents = Math.min(...prices);
    this.maxPriceCents = Math.max(...prices);
  }

  const skus = this.variants.map((variant) => variant.sku.toUpperCase());
  if (new Set(skus).size !== skus.length) {
    this.invalidate('variants', 'Variant SKUs must be unique within a product.');
  }

  for (const variant of this.variants) {
    if (
      variant.compareAtPriceCents !== undefined &&
      variant.compareAtPriceCents < variant.priceCents
    ) {
      this.invalidate(
        'variants',
        'A comparison price cannot be lower than the current variant price.',
      );
      break;
    }
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
