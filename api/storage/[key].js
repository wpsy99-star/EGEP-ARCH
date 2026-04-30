import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  const { key } = req.query;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('storage')
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, value: data?.value ?? null });
  }

  if (req.method === 'POST') {
    const { value } = req.body ?? {};
    if (value === undefined) return res.status(400).json({ ok: false, error: 'value 필드가 없습니다.' });

    const { error } = await supabase
      .from('storage')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.json({ ok: true });
  }

  res.status(405).json({ ok: false, error: 'Method Not Allowed' });
}
