const supabase = require('../config/supabase');

const getWallet = async (wallet_id) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', wallet_id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Wallet not found: ${wallet_id}`);
    return data;
};

const updateWallet = async (wallet_id, updates) => {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', wallet_id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

module.exports = { getWallet, updateWallet };