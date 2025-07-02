require('dotenv').config();
const readline = require('readline');
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.ATLAS_URI;
const encryptionKey = process.env.ENCRYPTION_KEY; // 32 bytes key
const ivLength = 16; // For AES, this is always 16

if (!encryptionKey) {
  throw new Error('Missing ENCRYPTION_KEY environment variable');
}

let TimeSlots;

// Function to decrypt data
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

// DAO function to initialize DB connection
async function injectDB(connection) {
  if (!connection) return;

  try {
    TimeSlots = await connection.collection('TimeSlots');
    console.log('Connected to MongoDB TimeSlots collection');
  } catch (err) {
    console.log(`Unable to establish a collection handle: ${err}`);
  }
}

// DAO function to get and decrypt slot
async function getDecryptedSlot(slotId) {
  try {
    // Ensure slotId is a valid ObjectId
    if (!ObjectId.isValid(slotId)) {
      console.error('Invalid slot ID format:', slotId);
      return { error: 'Invalid slot ID format' };
    }

    console.log('Searching for slot with ID:', slotId);

    // Find the slot by ID
    const slot = await TimeSlots.findOne({
      _id: new ObjectId(slotId),
    });

    if (!slot) {
      console.error('Slot not found for ID:', slotId);
      return {
        status: false,
        message: 'Slot not found',
      };
    }

    console.log('Found slot:', slot);

    // Check if slot is booked
    if (!slot.isBooked) {
      return {
        status: false,
        message: 'Slot is not booked',
      };
    }

    // Decrypt the 'details' field
    if (slot.details) {
      const decryptedDetails = JSON.parse(decrypt(slot.details));
      slot.details = decryptedDetails;
    }

    return slot;
  } catch (e) {
    console.error(`Unable to get and decrypt slot: ${e}`);
    return { error: e.message };
  }
}

// CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question and get the input
const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

const main = async () => {
  let client;
  try {
    // Initialize MongoDB connection
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    await injectDB(client.db(process.env.DB));

    console.log('Connected to MongoDB');

    // Test the connection by retrieving a slot
    // Get input from the user for slot retrieval parameters if necessary
    const slotId = await askQuestion('Enter slot ID: ');

    console.log('User entered slot ID:', slotId);

    // Directly call the DAO function to get the slot data
    const slotData = await getDecryptedSlot(slotId);

    // Output the result
    console.log('Retrieved slot data:');
    console.log(slotData);
  } catch (error) {
    console.error('Error:', error);
    console.log('Error retrieving slots.');
  } finally {
    // Close the readline interface
    rl.close();
    if (client) {
      await client.close();
    }
  }
};

// Run the main function
main();
