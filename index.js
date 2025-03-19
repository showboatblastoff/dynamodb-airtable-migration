require('dotenv').config();
const Airtable = require('airtable');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configure Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// Configure DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Fetch records from Airtable
    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select({})
      .all();
    
    console.log(`Found ${records.length} records in Airtable`);

    // Process each record
    for (const record of records) {
      const item = {
        id: record.id,
        ...record.fields,
        // Add a timestamp for when the record was migrated
        migratedAt: new Date().toISOString()
      };

      // Write to DynamoDB
      const command = new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: item
      });

      await docClient.send(command);
      console.log(`Migrated record ${record.id}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData(); 