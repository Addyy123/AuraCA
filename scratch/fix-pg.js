const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: "postgresql://postgres.kiujxlylmpqkcmtuqose:BZ%25pQt%23%26MT%3F!3vw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
  });

  await client.connect();

  const res = await client.query(`SELECT id, name FROM firms LIMIT 1;`);
  const firm = res.rows[0];

  console.log('Current Firm:', firm);

  if (firm && firm.name === 'Dummy Clint') {
    await client.query(`UPDATE firms SET name = $1 WHERE id = $2`, ['Dummy Client', firm.id]);
    console.log('Updated firm name to "Dummy Client"');
  } else {
    console.log('No update needed.');
  }

  await client.end();
}

fix().catch(console.error);
