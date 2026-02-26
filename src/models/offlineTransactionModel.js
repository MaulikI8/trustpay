const supabase = require('../config/supabase');

const getTransaction = async (txn_id) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', txn_id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

const createTransaction = async (txnData) => {
    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            id: txnData.txn_id,
            sender_id: txnData.from_wallet,
            recipient_id: txnData.to_wallet,
            amount: txnData.amount,
            status: 'settled',
            recipient_type: 'USER',
            currency: 'NPR',
            category: 'TRANSFER',
            note: 'Offline synced payment'
        }])
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    return data;
};

module.exports = { getTransaction, createTransaction };
