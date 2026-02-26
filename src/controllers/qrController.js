const qrSyncService = require('../services/qrSyncService');
const catchAsync = require('../utils/catchAsync');

exports.reserve = catchAsync(async (req, res) => {
    console.log('[QR] Incoming reserve request:', req.body);
    const { wallet_id, amount } = req.body;
    const result = await qrSyncService.reserveOfflineBalance(wallet_id, Number(amount));
    res.status(200).json({ status: 'success', data: result });
});

exports.generate = catchAsync(async (req, res) => {
    const { wallet_id, amount, purpose = 'PERSONAL', note = '' } = req.body;
    const result = await qrSyncService.generateOfflinePayload(wallet_id, Number(amount), purpose, note);
    res.status(200).json({
        status: 'success',
        message: '✅ QR payload generated. Encode the `data` object as a QR code for offline payment.',
        data: result
    });
});

exports.sync = catchAsync(async (req, res) => {
    const result = await qrSyncService.syncOfflineTransaction({
        ...req.body,
        amount: Number(req.body.amount)
    });
    res.status(200).json({ status: 'success', data: result });
});