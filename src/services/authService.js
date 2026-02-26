const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const EmailService = require('../services/mailService');

class AuthService {

  static async registerUserService(data) {
    const { full_name, email, phone, security_pin } = data;

    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const { data: existingPhone } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      const err = new Error('An account with this phone number already exists.');
      err.statusCode = 409;
      throw err;
    }

    const fonepay_id = 'FP-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ 
        full_name, 
        email, 
        phone, 
        security_pin,  
        fonepay_id
      }])
      .select('id, full_name, email, phone, fonepay_id, trust_score, created_at')
      .single();

    if (insertError) throw new Error(insertError.message);

    const { error: walletError } = await supabase
      .from('wallets')
      .insert([{
        wallet_id: fonepay_id,
        user_id: newUser.id,
        balance: 10000,          
        offline_reserved: 0,
        offline_used: 0,
        kyc_status: 'VERIFIED'  

      }]);

    if (walletError) throw new Error('User created but wallet setup failed: ' + walletError.message);

    EmailService.sendWelcomeEmail(newUser.email, newUser.full_name);

    return newUser;
  }

  static async loginUserService(phone, security_pin) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, security_pin, fonepay_id, trust_score')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!user) {
      const err = new Error('Invalid phone number or Security PIN.');
      err.statusCode = 401;
      throw err;
    }

    if (security_pin !== user.security_pin) {
      const err = new Error('Invalid phone number or Security PIN.');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fonepay_id: user.fonepay_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { security_pin: _, ...safeUser } = user;

    return { user: safeUser, token };
  }
}

module.exports = AuthService;