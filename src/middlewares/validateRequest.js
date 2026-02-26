const validateRequest = (schema) => (req, res, next) => {
  try {
    const actualSchema = schema.parse ? schema : schema.registerSchema;
    req.body = actualSchema.parse(req.body);
    next();
  } catch (error) {
    let errorDetails = [];

    if (error.errors) {
      errorDetails = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
    } else {
      try {
        const parsed = JSON.parse(error.message);
        errorDetails = Array.isArray(parsed) ? parsed : [{ message: error.message }];
      } catch (e) {
        errorDetails = [{ message: error.message }];
      }
    }

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errorDetails
    });
  }
};

module.exports = validateRequest;
