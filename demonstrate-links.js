require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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

async function findLinkedRecords() {
  try {
    console.log('Fetching data from both tables...\n');
    
    const complaints = await getAllComplaints();
    const vcFiles = await getAllVcFiles();

    console.log(`Found ${complaints.length} complaints and ${vcFiles.length} files\n`);

    // Create a map of complaints by ID for quick lookup
    const complaintsMap = new Map(complaints.map(c => [c.id, c]));

    // Analyze relationships
    console.log('Analyzing relationships between complaints and files...\n');

    const relationships = [];

    // Look for files that reference complaints
    for (const file of vcFiles) {
      const fileComplaints = file.complaints || [];
      const complaintsCopy = file.complaintsCopy || [];
      
      if (fileComplaints.length > 0 || complaintsCopy.length > 0) {
        const relationship = {
          fileId: file.id,
          fileName: file.name,
          fileSlug: file.slug,
          linkedComplaints: [],
        };

        // Check primary complaints array
        for (const complaintId of fileComplaints) {
          const complaint = complaintsMap.get(complaintId);
          if (complaint) {
            relationship.linkedComplaints.push({
              complaintId,
              paragraphNumber: complaint.paragraphNumber,
              category: complaint.category,
              subCategory: complaint.subCategory
            });
          }
        }

        // Check secondary complaints array (complaintsCopy)
        for (const complaintId of complaintsCopy) {
          const complaint = complaintsMap.get(complaintId);
          if (complaint && !relationship.linkedComplaints.some(c => c.complaintId === complaintId)) {
            relationship.linkedComplaints.push({
              complaintId,
              paragraphNumber: complaint.paragraphNumber,
              category: complaint.category,
              subCategory: complaint.subCategory
            });
          }
        }

        if (relationship.linkedComplaints.length > 0) {
          relationships.push(relationship);
        }
      }
    }

    // Print findings
    console.log('Found Relationships:');
    console.log('===================\n');

    relationships.forEach((rel, index) => {
      console.log(`File ${index + 1}:`);
      console.log(`ID: ${rel.fileId}`);
      console.log(`Name: ${rel.fileName}`);
      console.log(`Slug: ${rel.fileSlug}`);
      console.log('\nLinked Complaints:');
      
      rel.linkedComplaints.forEach((complaint, i) => {
        console.log(`\n  Complaint ${i + 1}:`);
        console.log(`  ID: ${complaint.complaintId}`);
        console.log(`  Paragraph Number: ${complaint.paragraphNumber}`);
        console.log(`  Category: ${complaint.category}`);
        console.log(`  Sub-Category: ${complaint.subCategory}`);
      });
      console.log('\n-------------------\n');
    });

    // Print summary statistics
    console.log('Summary Statistics:');
    console.log(`Total Files: ${vcFiles.length}`);
    console.log(`Files with Linked Complaints: ${relationships.length}`);
    console.log(`Total Complaints: ${complaints.length}`);
    
    const totalLinks = relationships.reduce((sum, rel) => sum + rel.linkedComplaints.length, 0);
    console.log(`Total Relationships: ${totalLinks}`);
    
    const avgLinksPerFile = relationships.length > 0 
      ? (totalLinks / relationships.length).toFixed(2) 
      : 0;
    console.log(`Average Complaints per Linked File: ${avgLinksPerFile}`);

  } catch (error) {
    console.error('Error analyzing relationships:', error);
  }
}

// Run the analysis
findLinkedRecords(); 