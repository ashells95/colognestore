const express = require('express');
const { createProductController } = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/authenticate');
const validateRequest = require('../validators/request');
const {
  productParamsSchema,
  productQuerySchema,
  productSchema,
  productUpdateSchema,
} = require('../validators/products');

function createProductRouter({ jwtSecret }) {
  const router = express.Router();
  const controller = createProductController();
  const adminOnly = [authenticate(jwtSecret), requireAdmin];

  router.get('/', validateRequest(productQuerySchema, 'query'), controller.list);
  router.get(
    '/admin',
    ...adminOnly,
    validateRequest(productQuerySchema, 'query'),
    controller.adminList,
  );
  router.get('/:slug', controller.getBySlug);

  router.post('/', ...adminOnly, validateRequest(productSchema), controller.create);
  router.patch(
    '/:id',
    ...adminOnly,
    validateRequest(productParamsSchema, 'params'),
    validateRequest(productUpdateSchema),
    controller.update,
  );
  router.delete(
    '/:id',
    ...adminOnly,
    validateRequest(productParamsSchema, 'params'),
    controller.archive,
  );

  return router;
}

module.exports = createProductRouter;
