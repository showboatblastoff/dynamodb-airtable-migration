require('dotenv').config();
const Airtable = require('airtable');

// Configure Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

async function inspectSchema() {
  try {
    console.log('Fetching sample records from Airtable...');
    
    // Fetch a few records to analyze the schema
    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select({
        maxRecords: 5
      })
      .all();
    
    if (records.length === 0) {
      console.log('No records found in the table.');
      return;
    }

    // Analyze the first record to understand the schema
    const sampleRecord = records[0];
    console.log('\nTable Schema:');
    console.log('-------------');
    Object.entries(sampleRecord.fields).forEach(([key, value]) => {
      console.log(`${key}: ${typeof value} (Sample: ${JSON.stringify(value)})`);
    });

    console.log('\nTotal records found:', records.length);
    console.log('\nSample Record:');
    console.log(JSON.stringify(sampleRecord, null, 2));

  } catch (error) {
    console.error('Error inspecting schema:', error);
    process.exit(1);
  }
}

// Run the inspection
inspectSchema(); 