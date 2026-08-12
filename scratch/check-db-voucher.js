const { Client } = require('pg');

async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres.kiujxlylmpqkcmtuqose:BZ%25pQt%23%26MT%3F!3vw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres' });
  await c.connect();
  
  const v = await c.query('SELECT * FROM vouchers ORDER BY created_at DESC LIMIT 1');
  const voucher = v.rows[0];
  if (!voucher) { console.log('No voucher'); return; }
  
  const l = await c.query('SELECT * FROM voucher_lines WHERE voucher_id = $1 ORDER BY sort_order ASC', [voucher.id]);
  
  console.log('--- VOUCHER ---');
  console.log(voucher);
  console.log('--- LINES ---');
  console.log(l.rows);
  
  let totalDebit = 0;
  let totalCredit = 0;
  l.rows.forEach(line => {
    if (line.entry_type === 'DEBIT') totalDebit += Number(line.amount);
    else totalCredit += Number(line.amount);
  });
  
  console.log(`TOTAL DEBIT: ${totalDebit}, TOTAL CREDIT: ${totalCredit}`);
  console.log(`DIFFERENCE: ${totalDebit - totalCredit}`);

  await c.end();
}
run();
