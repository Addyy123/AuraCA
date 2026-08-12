const http = require('http');

const xml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const req = http.request('http://localhost:9000', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('TALLY RESPONSE:', data));
});

req.on('error', (err) => console.error('TALLY ERROR:', err.message));
req.write(xml);
req.end();
