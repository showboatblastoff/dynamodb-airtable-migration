require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function getAllComplaints() {
  try {
    const command = new ScanCommand({
      TableName: 'complaints',
    });
    const response = await docClient.send(command);
    return response.Items;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
}

async function getAllVcFiles() {
  try {
    const command = new ScanCommand({
      TableName: 'vcFiles',
    });
    const response = await docClient.send(command);
    return response.Items;
  } catch (error) {
    console.error('Error fetching vcFiles:', error);
    return [];
  }
}

async function updateComplaint(complaintId, vcFileIds) {
  try {
    const command = new UpdateCommand({
      TableName: 'complaints',
      Key: { id: complaintId },
      UpdateExpression: 'SET vcFiles = :vcFileIds',
      ExpressionAttributeValues: {
        ':vcFileIds': vcFileIds
      }
    });
    await docClient.send(command);
    console.log(`Updated complaint ${complaintId} with vcFiles references`);
  } catch (error) {
    console.error(`Error updating complaint ${complaintId}:`, error);
  }
}

async function updateVcFile(vcFileId, complaintIds) {
  try {
    const command = new UpdateCommand({
      TableName: 'vcFiles',
      Key: { id: vcFileId },
      UpdateExpression: 'SET complaints = :complaintIds',
      ExpressionAttributeValues: {
        ':complaintIds': complaintIds
      }
    });
    await docClient.send(command);
    console.log(`Updated vcFile ${vcFileId} with complaint references`);
  } catch (error) {
    console.error(`Error updating vcFile ${vcFileId}:`, error);
  }
}

async function linkTables() {
  try {
    console.log('Fetching data from both tables...\n');
    
    const complaints = await getAllComplaints();
    const vcFiles = await getAllVcFiles();

    console.log(`Found ${complaints.length} complaints and ${vcFiles.length} files\n`);

    // Create maps for quick lookups
    const complaintsMap = new Map(complaints.map(c => [c.id, c]));
    const vcFilesMap = new Map(vcFiles.map(f => [f.id, f]));

    // Track relationships
    const complaintToFiles = new Map(); // complaint ID -> vcFile IDs
    const fileToComplaints = new Map(); // vcFile ID -> complaint IDs

    // Process existing relationships from vcFiles
    for (const file of vcFiles) {
      const fileId = file.id;
      const linkedComplaints = new Set([
        ...(file.complaints || []),
        ...(file.complaintsCopy || [])
      ]);

      if (linkedComplaints.size > 0) {
        fileToComplaints.set(fileId, Array.from(linkedComplaints));
        
        // Update reverse relationships
        for (const complaintId of linkedComplaints) {
          if (!complaintToFiles.has(complaintId)) {
            complaintToFiles.set(complaintId, new Set());
          }
          complaintToFiles.get(complaintId).add(fileId);
        }
      }
    }

    // Update both tables with the relationships
    console.log('Updating relationships in both tables...\n');

    // Update complaints with vcFiles references
    for (const [complaintId, fileIds] of complaintToFiles.entries()) {
      await updateComplaint(complaintId, Array.from(fileIds));
    }

    // Update vcFiles with complaints references
    for (const [fileId, complaintIds] of fileToComplaints.entries()) {
      await updateVcFile(fileId, complaintIds);
    }

    // Print summary
    console.log('\nSummary:');
    console.log(`Total complaints updated: ${complaintToFiles.size}`);
    console.log(`Total files updated: ${fileToComplaints.size}`);
    
    const totalLinks = Array.from(complaintToFiles.values())
      .reduce((sum, fileIds) => sum + fileIds.size, 0);
    console.log(`Total relationships created: ${totalLinks}`);

  } catch (error) {
    console.error('Error linking tables:', error);
  }
}

// Run the linking process
linkTables(); 