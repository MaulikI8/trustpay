const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const newUser = await authService.registerUserService(req.body);

    return res.status(201).json({
      status: 'success',
      message: 'Registration successful!',
      data: {
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        fonepay_id: newUser.fonepay_id, 
        trust_score: newUser.trust_score,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, security_pin } = req.body;
    const { user, token } = await authService.loginUserService(phone, security_pin);

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token, 
      data: {
        full_name: user.full_name,
        email: user.email,
        fonepay_id: user.fonepay_id, 
        trust_score: user.trust_score
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  register,
  login
};