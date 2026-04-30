import { supabase } from './_supabase.js';

function normalizeDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === 'string') {
    const m = val.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return null;
}

function normalizeHeader(h) {
  return String(h).trim().normalize('NFC');
}

export function normalizeRow(row) {
  const get = (key) => {
    const normalized = normalizeHeader(key);
    for (const [k, v] of Object.entries(row)) {
      if (normalizeHeader(k) === normalized) return v ?? null;
    }
    return null;
  };

  const 신청일 = normalizeDate(get('신청일'));
  const month_key = 신청일 ? 신청일.slice(0, 7) : null;

  return {
    신청번호: String(get('신청번호') ?? '').trim(),
    순번: Number(get('순번')) || 0,
    비목: String(get('비목') ?? '').trim(),
    지급구분: String(get('지급구분') ?? '').trim(),
    증빙유형: String(get('증빙유형') ?? '').trim(),
    출장_학회보고: String(get('출장/학회보고') ?? get('출장_학회보고') ?? '').trim(),
    내역: String(get('내역') ?? '').trim(),
    신청금액: Number(get('신청금액')) || 0,
    공급가액: Number(get('공급가액')) || 0,
    세액: Number(get('세액')) || 0,
    신청일,
    month_key,
    산학승인일: normalizeDate(get('산학승인일')),
    지급예정일: normalizeDate(get('지급(예정)일') ?? get('지급예정일')),
    상태: String(get('상태') ?? '').trim(),
    추출인명: String(get('추출인명') ?? '').trim(),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const { records } = req.body ?? {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ ok: false, error: '레코드가 없습니다.' });
  }

  // 이미 존재하는 신청번호 조회
  const incoming신청번호 = records.map(r => r['신청번호']).filter(Boolean);
  const { data: existing } = await supabase
    .from('records')
    .select('"신청번호"')
    .in('"신청번호"', incoming신청번호);

  const existingSet = new Set((existing ?? []).map(r => r['신청번호']));
  const newRecords = records.filter(r => r['신청번호'] && !existingSet.has(r['신청번호']));
  const skipped = records.length - newRecords.length;

  if (newRecords.length > 0) {
    const { error } = await supabase.from('records').insert(newRecords);
    if (error) return res.status(500).json({ ok: false, error: error.message });
  }

  // 저장된 월 목록 반환
  const { data: monthRows } = await supabase
    .from('records')
    .select('month_key')
    .not('month_key', 'is', null)
    .order('month_key');
  const months = [...new Set((monthRows ?? []).map(r => r.month_key))];

  res.json({ ok: true, inserted: newRecords.length, skipped, total: records.length, months });
}
