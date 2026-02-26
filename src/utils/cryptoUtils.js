const crypto = require('crypto');
require('dotenv').config();

const HMAC_SECRET = process.env.JWT_SECRET || 'evolvix_super_secret_key_2026';

const signData = (data) => {
    return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
};

const verifySignature = (data, signature) => {
    try {
        const expected = signData(data);
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
        return false;
    }
};

module.exports = { signData, verifySignature };