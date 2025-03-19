require('dotenv').config();
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function createTable() {
  try {
    const command = new CreateTableCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S', // String type for Airtable ID
        }
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH', // Partition key
        }
      ],
      BillingMode: 'PAY_PER_REQUEST', // On-demand capacity
    });

    console.log('Creating DynamoDB table...');
    const response = await client.send(command);
    console.log('Table created successfully:', response.TableDescription.TableName);
    
    // Wait a few seconds for the table to be ready
    console.log('Waiting for table to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('Table is ready for data import');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Table already exists, proceeding with data import...');
    } else {
      console.error('Error creating table:', error);
      process.exit(1);
    }
  }
}

createTable(); 