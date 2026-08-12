const http = require('http');
const { Client } = require('pg');

async function testTallyCompany(companyName) {
  return new Promise((resolve) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="Test Ledger For Name Check" ACTION="Create">
            <NAME>Test Ledger For Name Check</NAME>
            <PARENT>Indirect Expenses</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const req = http.request('http://localhost:9000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve('ERROR'));
    req.write(xml);
    req.end();
  });
}

async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres.kiujxlylmpqkcmtuqose:BZ%25pQt%23%26MT%3F!3vw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres' });
  await c.connect();
  const res = await c.query('SELECT name FROM firms;');
  const names = res.rows.map(r => r.name);
  names.push('Demo CA Firm');
  names.push('Dummy Clint');
  names.push('Company');
  names.push('');

  for (const name of names) {
    console.log(`Testing company: "${name}"`);
    const result = await testTallyCompany(name);
    if (!result.includes('Could not set')) {
      console.log(`SUCCESS or DIFFERENT ERROR with "${name}":`, result);
    }
  }
  await c.end();
}
run();
