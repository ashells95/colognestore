const Product = require('../models/Product');
const { calculatePriceRange, listProducts, slugify } = require('../services/productService');

function createProductController() {
  return {
    async list(req, res, next) {
      try {
        res.json(await listProducts(req.validated.query));
      } catch (error) {
        next(error);
      }
    },

    async getBySlug(req, res, next) {
      try {
        const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
        if (!product) {
          res.status(404).json({ error: 'Product not found.' });
          return;
        }

        res.json({ product });
      } catch (error) {
        next(error);
      }
    },

    async adminList(req, res, next) {
      try {
        res.json(await listProducts(req.validated.query, { includeInactive: true }));
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const data = { ...req.validated.body };
        data.slug = slugify(data.slug || data.name);
        Object.assign(data, calculatePriceRange(data.variants));
        const product = await Product.create(data);
        res.status(201).json({ product });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const update = { ...req.validated.body };
        if (update.name && !update.slug) update.slug = slugify(update.name);
        const product = await Product.findById(req.params.id);
        if (!product) {
          res.status(404).json({ error: 'Product not found.' });
          return;
        }

        Object.assign(product, update);
        if (update.variants) {
          Object.assign(product, calculatePriceRange(update.variants));
        }
        await product.save();
        res.json({ product });
      } catch (error) {
        next(error);
      }
    },

    async archive(req, res, next) {
      try {
        const product = await Product.findByIdAndUpdate(
          req.params.id,
          { active: false },
          { new: true, runValidators: true },
        );
        if (!product) {
          res.status(404).json({ error: 'Product not found.' });
          return;
        }

        res.json({ product });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = { createProductController };
