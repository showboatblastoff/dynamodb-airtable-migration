require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function scanTable(tableName) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: 5 // Get a sample of records for analysis
    });

    const response = await docClient.send(command);
    return response.Items;
  } catch (error) {
    console.error(`Error scanning table ${tableName}:`, error);
    return [];
  }
}

async function analyzeTableStructure(items) {
  if (!items || items.length === 0) return {};

  // Analyze the structure of the first item
  const structure = {};
  const sampleItem = items[0];

  Object.entries(sampleItem).forEach(([key, value]) => {
    structure[key] = {
      type: typeof value,
      sample: value,
      isPresent: items.every(item => key in item)
    };
  });

  return structure;
}

async function findCommonFields(structure1, structure2) {
  const commonFields = [];
  
  Object.keys(structure1).forEach(key => {
    if (key in structure2) {
      commonFields.push({
        field: key,
        type1: structure1[key].type,
        type2: structure2[key].type,
        sample1: structure1[key].sample,
        sample2: structure2[key].sample
      });
    }
  });

  return commonFields;
}

async function analyzeTables() {
  try {
    console.log('Analyzing tables...\n');

    // Get sample data from both tables
    const complaintsData = await scanTable('complaints');
    const vcFilesData = await scanTable('vcFiles');

    console.log('Complaints table sample count:', complaintsData.length);
    console.log('vcFiles table sample count:', vcFilesData.length);

    // Analyze structure of both tables
    const complaintsStructure = await analyzeTableStructure(complaintsData);
    const vcFilesStructure = await analyzeTableStructure(vcFilesData);

    console.log('\nComplaints table structure:');
    console.log(JSON.stringify(complaintsStructure, null, 2));

    console.log('\nvcFiles table structure:');
    console.log(JSON.stringify(vcFilesStructure, null, 2));

    // Find common fields
    const commonFields = await findCommonFields(complaintsStructure, vcFilesStructure);

    console.log('\nCommon fields between tables:');
    console.log(JSON.stringify(commonFields, null, 2));

    // Look for potential foreign key relationships
    console.log('\nPotential relationships:');
    commonFields.forEach(field => {
      if (field.field.toLowerCase().includes('id')) {
        console.log(`Potential relationship found: ${field.field}`);
        console.log(`Complaints sample: ${field.sample1}`);
        console.log(`vcFiles sample: ${field.sample2}`);
      }
    });

  } catch (error) {
    console.error('Error analyzing tables:', error);
  }
}

analyzeTables(); 