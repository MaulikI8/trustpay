const { z } = require('zod');

const VALID_PURPOSES = [
  'PERSONAL', 'MERCHANT', 'KIRYANA', 'TRANSPORT',
  'UTILITY', 'EDUCATION', 'HEALTH', 'AGRICULTURE',
  'REMITTANCE', 'FESTIVAL', 'OTHER'
];

const reserveSchema = z.object({
  wallet_id: z.string().min(1, 'wallet_id is required'),
  amount:    z.number({ coerce: true }).positive('Amount must be positive').max(50000, 'Max reserve is 50,000 NPR')
});

const generateSchema = z.object({
  wallet_id: z.string().min(1, 'wallet_id is required'),
  amount:    z.number({ coerce: true }).positive('Amount must be positive').max(5000, 'Max per transaction is 5,000 NPR'),
  purpose:   z.enum(VALID_PURPOSES).default('PERSONAL'),
  note:      z.string().max(100, 'Note too long').optional().default('')
});

const syncSchema = z.object({
  from_wallet:   z.string().min(1, 'from_wallet is required'),
  to_wallet:     z.string().min(1, 'to_wallet is required'),
  amount:        z.number({ coerce: true }).positive('Amount must be positive'),
  timestamp:     z.number({ coerce: true }).positive(),
  txn_id:        z.string().uuid('txn_id must be a valid UUID'),
  signature:     z.string().min(1, 'signature is required'),
  purpose:       z.enum(VALID_PURPOSES).optional().default('PERSONAL'),
  note:          z.string().max(100).optional().default(''),
  sync_deadline: z.number({ coerce: true }).positive().optional(),
});

module.exports = { reserveSchema, generateSchema, syncSchema };