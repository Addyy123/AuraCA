const TALLY_URL = 'http://localhost:9000';

async function postToTally(xml: string): Promise<string> {
  const response = await fetch(TALLY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  });
  return response.text();
}

async function testFormat(name: string, xml: string) {
  console.log(`\n--- Testing ${name} ---`);
  const res = await postToTally(xml);
  console.log('Result:', res);
}

async function main() {
  const userXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Adi</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20260401</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>VCH-C5AA-236063</VOUCHERNUMBER>
            <NARRATION>Being purchase from Skyline Solutions vide Invoice #Geillv20250624 dated 2025-05-08</NARRATION>
            <EFFECTIVEDATE>20260401</EFFECTIVEDATE>
            <REFERENCE>Geillv20250624</REFERENCE>
            <PARTYNAME>Skyline Solutions</PARTYNAME>
            <PARTYLEDGERNAME>Skyline Solutions</PARTYLEDGERNAME>

        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Skyline Solutions</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>20085.25</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Computer &amp; IT Equipment</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-2500.00</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Computer &amp; IT Equipment</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-3750.00</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Computer &amp; IT Equipment</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-5550.00</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Miscellaneous Expenses</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-2900.00</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Computer &amp; IT Equipment</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-3800.00</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-1585.25</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  await testFormat('User exact XML with DATE = 20260401', userXml);
}

main();
