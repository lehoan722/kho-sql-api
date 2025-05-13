import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS xử lý OPTIONS request trước
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ hỗ trợ POST' });
  }

  const { sql_id, email } = req.body;
  if (!sql_id || !email) return res.status(400).json({ error: 'Thiếu thông tin' });

  const { data: sqlRow, error: getError } = await supabase
    .from('kho_sql')
    .select('*')
    .eq('id', sql_id)
    .single();

  if (getError || !sqlRow) return res.status(404).json({ error: 'Không tìm thấy tập lệnh' });

  const canRun = sqlRow.is_public || sqlRow.created_by === email || (sqlRow.allow_run || []).includes(email);
  if (!canRun) return res.status(403).json({ error: 'Không có quyền chạy lệnh này' });

  try {
    const sql = sqlRow.sql_text.trim().toLowerCase();
    if (!sql.startsWith('select')) {
      return res.status(400).json({ error: 'Chỉ được phép chạy câu lệnh SELECT' });
    }

    const { data, error: queryError } = await supabase.rpc('run_safe_sql', {
      query: sqlRow.sql_text
    });

    if (queryError) throw queryError;

    await supabase.from('kho_sql').update({
      last_run_by: email,
      last_run_at: new Date().toISOString()
    }).eq('id', sql_id);

    res.json({ result: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
