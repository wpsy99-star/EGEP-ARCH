import { supabase } from './_supabase.js';

function mapRow(row) {
  const { id, month_key, imported_at, 출장_학회보고, 지급예정일, ...rest } = row;
  return {
    ...rest,
    '출장/학회보고': 출장_학회보고 ?? '',
    '지급(예정)일': 지급예정일 ?? '',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const { month } = req.query;
  let query = supabase.from('records').select('*');
  if (month) {
    query = query.eq('month_key', month).order('순번');
  } else {
    query = query.order('신청일').order('순번');
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ ok: false, error: error.message });

  res.json({ ok: true, records: (data ?? []).map(mapRow) });
}
