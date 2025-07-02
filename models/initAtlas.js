const { MongoClient, ServerApiVersion } = require('mongodb');

const CalendarDAO = require('./CalendarDAO.js');
const uri = process.env.ATLAS_URI;
console.log('uri', uri);
if (!uri) {
  console.error('ATLAS_URI is missing from the .env file');
  process.exit(1);
}

module.exports.InitDBAtlas = async function initDBAtlas() {
  console.log(uri);
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    // Inject the DB connection to the DAOs
    await CalendarDAO.injectDB(client.db(process.env.DB));
    return;
  } catch (error) {
    console.error('Error initializing database connection', error);
  }
};
