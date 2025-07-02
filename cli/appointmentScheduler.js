require('dotenv').config();
const readline = require('readline');
const { MongoClient } = require('mongodb');
const moment = require('moment-timezone');

//node cli/appointmentScheduler.js

const uri = process.env.ATLAS_URI;
if (!uri) {
  throw new Error('Missing ATLAS_URI environment variable');
}

let TimeSlots;

async function injectDB(connection) {
  if (!connection) return;

  try {
    TimeSlots = await connection.collection('TimeSlots');
    console.log('Connected to MongoDB TimeSlots collection');
  } catch (err) {
    console.log(`Unable to establish a collection handle: ${err}`);
  }
}

async function addSlot(slots) {
  try {
    await TimeSlots.insertMany(slots);
    return { success: true };
  } catch (e) {
    console.error(`Unable to post slot: ${e}`);
    return { error: e };
  }
}

async function addAppointment(
  startTime,
  endTime,
  durationMinutes,
  overlapMinutes
) {
  console.log(startTime, endTime, durationMinutes, overlapMinutes);
  const UtcStartTime = new Date(startTime);
  const UtcEndTime = new Date(endTime);
  let slots = [];
  for (let current = new Date(UtcStartTime); current < UtcEndTime; ) {
    let slotStart = new Date(current);
    let slotEnd = new Date(
      slotStart.getTime() + durationMinutes * 60000
    );
    const startTimeNY = moment(slotStart)
      .tz('America/New_York')
      .format('h:mm A');
    const endTimeNY = moment(slotEnd)
      .tz('America/New_York')
      .format('h:mm A');
    const dateNY = moment(slotStart)
      .tz('America/New_York')
      .format('MMMM D, YYYY');
    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      isBooked: false,
      details: {},
      NewYorkTime: `${startTimeNY} to ${endTimeNY} on ${dateNY}`,
    });
    current = new Date(
      current.getTime() + (durationMinutes - overlapMinutes) * 60000
    );
  }
  try {
    const response = await addSlot(slots);
    console.log(response);
  } catch (error) {
    console.error('Error adding time slots', error);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => rl.question(question, resolve));
};

const main = async () => {
  let client;
  try {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    await injectDB(client.db(process.env.DB));

    console.log('Connected to MongoDB');

    const startTime = await askQuestion(
      'Enter start time (e.g. 2024-07-29T17:00): '
    );
    const endTime = await askQuestion(
      'Enter end time (e.g. 2024-07-29T23:00): '
    );

    const durationMinutes = 30;
    const overlapMinutes = 15;

    await addAppointment(
      startTime,
      endTime,
      durationMinutes,
      overlapMinutes
    );

    console.log(`Slots added for ${startTime} to ${endTime}`);
  } catch (error) {
    console.error('Error:', error);
    console.log('Error adding slots.');
  } finally {
    rl.close();
    if (client) {
      await client.close();
    }
  }
};

main();
