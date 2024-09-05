const { MongoClient } = require('mongodb');
const config = require('config');

const uri = config.get('mongoURI');
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("fights");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

module.exports = connectToDatabase;