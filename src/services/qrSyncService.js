const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const walletModel = require('../models/walletModel');
const transactionModel = require('../models/offlineTransactionModel');
const { signData, verifySignature } = require('../utils/cryptoUtils');

const MAX_OFFLINE_RESERVE = 50000; 
const MAX_PER_TXN         = 5000;  
const DAILY_OFFLINE_LIMIT = 25000; 
const QR_EXPIRY_MS        = 24 * 60 * 60 * 1000;
const CURRENCY            = 'NPR';

const VALID_PURPOSES = [
  'PERSONAL',      
  'MERCHANT',      
  'KIRYANA',       
  'TRANSPORT',     
  'UTILITY',       
  'EDUCATION',     
  'HEALTH',        
  'AGRICULTURE',   
  'REMITTANCE',    
  'FESTIVAL',      
  'OTHER'
];

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 5;         

function checkRateLimit(wallet_id) {
    const now = Date.now();
    const entry = rateLimitMap.get(wallet_id) || { count: 0, windowStart: now, dailyUsed: 0 };

    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        entry.count = 0;
        entry.windowStart = now;
    }

    entry.count++;
    rateLimitMap.set(wallet_id, entry);

    if (entry.count > MAX_REQUESTS_PER_MIN) {
        throw Object.assign(
            new Error(`Too many requests. Max ${MAX_REQUESTS_PER_MIN} QR operations per minute. Please slow down.`),
            { statusCode: 429 }
        );
    }
}

function trackDailySpend(wallet_id, amount) {
    const entry = rateLimitMap.get(wallet_id) || { count: 0, windowStart: Date.now(), dailyUsed: 0 };
    entry.dailyUsed = (entry.dailyUsed || 0) + amount;
    rateLimitMap.set(wallet_id, entry);

    if (entry.dailyUsed > DAILY_OFFLINE_LIMIT) {
        throw Object.assign(
            new Error(`Daily offline limit of ${DAILY_OFFLINE_LIMIT} ${CURRENCY} reached. Sync online to reset.`),
            { statusCode: 429 }
        );
    }
}

function antiScamChecks(amount, purpose) {
    if (amount >= 3000 && purpose === 'OTHER') {
        throw Object.assign(
            new Error('For transactions above NPR 3,000, a specific purpose is required. Please set purpose to something other than OTHER.'),
            { statusCode: 400 }
        );
    }
}

exports.reserveOfflineBalance = async (wallet_id, amount) => {
    const wallet = await walletModel.getWallet(wallet_id);

    if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
    if (wallet.kyc_status === 'BANNED' || wallet.kyc_status === 'SUSPENDED') {
        throw Object.assign(
            new Error('Account suspended. KYC verification failed.'),
            { statusCode: 403 }
        );
    }
    if (amount <= 0) throw Object.assign(new Error('Amount must be greater than zero'), { statusCode: 400 });
    if (amount > MAX_OFFLINE_RESERVE) {
        throw Object.assign(
            new Error(`Maximum offline reserve is ${MAX_OFFLINE_RESERVE} ${CURRENCY}`),
            { statusCode: 400 }
        );
    }

    const currentBalance  = wallet.balance || 0;

    if (currentBalance < amount) {
        throw Object.assign(
            new Error(`Insufficient balance. Available: ${currentBalance} ${CURRENCY}, Requested: ${amount} ${CURRENCY}`),
            { statusCode: 400 }
        );
    }

    await walletModel.updateWallet(wallet_id, {
        balance: currentBalance - amount,
    });

    return {
        wallet_id,
        reserved_amount:   amount,
        remaining_balance: currentBalance - amount,
        currency:          CURRENCY,
        daily_limit:       DAILY_OFFLINE_LIMIT,
        max_per_txn:       MAX_PER_TXN,
        message: `✅ ${amount} ${CURRENCY} reserved for offline payments. You can now make payments in load-shedding, remote areas, or poor connectivity zones.`,
        tip: `💡 Tip: Your QR codes expire in 5 minutes. Generate QR just before payment.`
    };
};

exports.generateOfflinePayload = async (wallet_id, amount, purpose = 'PERSONAL', note = '') => {
    checkRateLimit(wallet_id);

    const wallet = await walletModel.getWallet(wallet_id);

    if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
    if (wallet.kyc_status === 'BANNED') throw Object.assign(new Error('KYC failed: Account banned'), { statusCode: 403 });
    if (amount <= 0) throw Object.assign(new Error('Amount must be greater than zero'), { statusCode: 400 });
    if (amount > MAX_PER_TXN) {
        throw Object.assign(
            new Error(`Single transaction limit is ${MAX_PER_TXN} ${CURRENCY}`),
            { statusCode: 400 }
        );
    }

    if (!VALID_PURPOSES.includes(purpose)) {
        throw Object.assign(
            new Error(`Invalid purpose. Valid options: ${VALID_PURPOSES.join(', ')}`),
            { statusCode: 400 }
        );
    }

    antiScamChecks(amount, purpose);

    const txn_id     = uuidv4();
    const timestamp  = Date.now();
    const expires_at = timestamp + QR_EXPIRY_MS;
    const dataString = `${wallet_id}:${amount}:${timestamp}:${txn_id}`;
    const signature  = signData(dataString);

    return {
        version:           '1.0',
        type:              'GLOBALSCOPE_OFFLINE_PAYMENT',
        network:           'FonePay-NP',
        from_wallet:       wallet_id,
        amount,
        currency:          CURRENCY,
        purpose,
        note:              note || '',
        txn_id,
        timestamp,
        expires_at,
        expires_in_seconds: Math.floor(QR_EXPIRY_MS / 1000),
        sync_deadline: null,
        signature,

        meta: {
            generated_at:      new Date(timestamp).toISOString(),
            valid_until:       new Date(expires_at).toISOString(),
            sync_deadline_iso: null, 
            scam_warning:      '⚠️ GlobalScope will NEVER ask you to scan a QR to RECEIVE money. Only scan to PAY.',
        }
    };
};

exports.syncOfflineTransaction = async (syncData) => {
    const { from_wallet, to_wallet, amount, timestamp, txn_id, signature, purpose = 'PERSONAL', note = '' } = syncData;

    if (!from_wallet || !to_wallet || !amount || !timestamp || !txn_id || !signature) {
        throw Object.assign(
            new Error('Missing required fields: from_wallet, to_wallet, amount, timestamp, txn_id, signature'),
            { statusCode: 400 }
        );
    }
    if (from_wallet === to_wallet) {
        throw Object.assign(new Error('Cannot transfer to yourself'), { statusCode: 400 });
    }

    checkRateLimit(from_wallet);

    const existingTx = await transactionModel.getTransaction(txn_id);
    if (existingTx) {
        throw Object.assign(
            new Error('⚠️ Fraud Alert: This QR has already been used. Report to GlobalScope if you did not make this payment.'),
            { statusCode: 409 }
        );
    }

    const sender   = await walletModel.getWallet(from_wallet);
    const receiver = await walletModel.getWallet(to_wallet);

    if (!sender)   throw Object.assign(new Error(`Sender wallet not found: ${from_wallet}`),   { statusCode: 404 });
    if (!receiver) throw Object.assign(new Error(`Receiver wallet not found: ${to_wallet}`), { statusCode: 404 });

    if (sender.kyc_status === 'BANNED')   throw Object.assign(new Error('Sender Account Banned'), { statusCode: 403 });
    if (receiver.kyc_status === 'BANNED') throw Object.assign(new Error('Receiver Account Banned'), { statusCode: 403 });

    if (amount > MAX_PER_TXN) {
        throw Object.assign(
            new Error(`Amount ${amount} exceeds per-transaction limit of ${MAX_PER_TXN} ${CURRENCY}`),
            { statusCode: 400 }
        );
    }

    trackDailySpend(from_wallet, amount);

    const dataString = `${from_wallet}:${amount}:${timestamp}:${txn_id}`;
    const isValid = verifySignature(dataString, signature);
    if (!isValid) {
        throw Object.assign(
            new Error('⚠️ Security Alert: Invalid signature. QR may have been tampered with. Do not proceed with this payment.'),
            { statusCode: 403 }
        );
    }

    await walletModel.updateWallet(to_wallet, {
        balance: (receiver.balance || 0) + amount,
    });

    await transactionModel.createTransaction({
        txn_id,
        from_wallet,
        to_wallet,
        amount,
        signature,
        status:     'SETTLED',
        is_offline: true,
    });

    return {
        status:       'SETTLED',
        txn_id,
        from_wallet,
        to_wallet,
        amount,
        currency:     CURRENCY,
        purpose,
        note:         note || '',
        settled_at:   new Date().toISOString(),
        message:      `✅ ${amount} ${CURRENCY} transferred from ${from_wallet} to ${to_wallet}`,
        scam_notice:  '🔒 If you did not authorize this, contact GlobalScope support immediately.'
    };
};