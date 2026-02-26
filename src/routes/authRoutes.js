const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    let cleanErrors = [];
    try {
      const parsed = JSON.parse(error.message);
      cleanErrors = parsed.map(err => ({ field: err.path.join('.'), message: err.message }));
    } catch (e) {
      cleanErrors = [{ message: error.message || 'Validation failed' }];
    }
    return res.status(400).json({ status: 'error', message: 'Validation failed', errors: cleanErrors });
  }
};

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);

module.exports = router;