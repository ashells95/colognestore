function validateRequest(schema, property = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      res.status(400).json({
        error: 'Request validation failed.',
        details: result.error.issues.map(({ path, message }) => ({
          field: path.join('.'),
          message,
        })),
      });
      return;
    }

    req.validated ??= {};
    req.validated[property] = result.data;
    next();
  };
}

module.exports = validateRequest;
