require('dotenv').config();
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

let TimeSlots;

// Define a key for encryption (for demonstration purposes only, store securely in practice)
const encryptionKey = process.env.ENCRYPTION_KEY; // 32 bytes key
const ivLength = 16; // For AES, this is always 16
if (!encryptionKey) {
  throw new Error('Missing ENCRYPTION_KEY environment variable');
}

// Function to encrypt data
function encrypt(text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

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

module.exports = class CalendarDAO {
  static async injectDB(connection) {
    if (!connection) return;

    try {
      TimeSlots = await connection.collection('TimeSlots');

      console.log('Connected to MongoDB TimeSlots collection');
    } catch (err) {
      console.log(
        `Unable to establish a collection handle in CalendarDAO: ${err}`
      );
    }
  }

  static async findAvailableDates(requestDate) {
    const startDate = new Date(Date.UTC(requestDate, 1, 0, 0, 0));
    startDate.setDate(startDate.getDate() - 15);

    const endDate = new Date(Date.UTC(requestDate + 1, 0, 0, 0, 0));
    endDate.setDate(endDate.getDate() + 15);
    try {
      const query = {
        startTime: {
          $gte: startDate,
          $lt: endDate,
        },
      };
      const cursor = await TimeSlots.find(query);
      const dates = await cursor.toArray();
      return dates;
    } catch (err) {
      console.error(`Error retrieving time slots for month: ${err}`);
      return {};
    }
  }

  static async findSlotsByDate(requestedDate) {
    // console.log("findSlotsByDate", requestedDate);
    requestedDate = new Date(requestedDate);
    const nextDay = new Date(requestedDate);
    nextDay.setDate(requestedDate.getDate() + 1);

    try {
      // Constructing the query to find slots that start on the specific date
      const query = {
        startTime: {
          $gte: requestedDate,
          $lt: nextDay,
        },
      };

      const results = await TimeSlots.find(query).toArray();
      // console.log("Found documents:", results);
      return results;
    } catch (err) {
      console.error(`Error retrieving time slots for month: ${err}`);
      return {};
    }
  }

  static async addSlot(slots) {
    // console.log('addSlot', slots);
    try {
      await TimeSlots.insertMany(slots);
      return { success: true };
    } catch (e) {
      console.error(`Unable to post slot: ${e}`);
      return { error: e };
    }
  }

  static async updateSlot(slotId, currentFormData) {
    try {
      // Check if the slot is already booked
      const slot = await TimeSlots.findOne({
        _id: new ObjectId(slotId),
      });

      if (!slot) {
        return {
          status: false,
          message: 'Slot not found',
        };
      }

      if (slot.isBooked) {
        console.log('Slot is already booked');
        return { status: false, message: 'Slot is already booked' };
      }

      // Encrypt currentFormData
      const encryptedFormData = encrypt(
        JSON.stringify(currentFormData)
      );

      // Update the slot to set isBooked to true and add encrypted currentFormData to details
      const updateResponse = await TimeSlots.updateOne(
        { _id: new ObjectId(slotId) },
        { $set: { isBooked: true, details: encryptedFormData } }
      );

      if (updateResponse.acknowledged) {
        return { status: true, message: 'Slot has been booked' };
      }
    } catch (e) {
      console.error(`Unable to update slot: ${e}`);
      return { error: e.message };
    }
  }

  static async getDecryptedSlot(slotId) {
    try {
      // Find the slot by ID
      const slot = await TimeSlots.findOne({
        _id: new ObjectId(slotId),
      });
      if (!slot.isBooked) {
        return {
          status: false,
          message: 'Slot is not booked',
        };
      }
      if (!slot) {
        return {
          status: false,
          message: 'Slot not found',
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
};
