const { Client } = require('pg');
async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres.kiujxlylmpqkcmtuqose:BZ%25pQt%23%26MT%3F!3vw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres' });
  await c.connect();
  await c.query(`UPDATE firms SET name = 'Adi' WHERE name = 'Dummy Client';`);
  console.log('Fixed firm name!');
  await c.end();
}
run();
