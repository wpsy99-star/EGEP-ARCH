import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const { data, error } = await supabase
    .from('records')
    .select('month_key')
    .not('month_key', 'is', null)
    .order('month_key');

  if (error) return res.status(500).json({ ok: false, error: error.message });

  const months = [...new Set((data ?? []).map(r => r.month_key))];
  res.json({ ok: true, months });
}
