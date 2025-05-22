import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
};

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Global connection cache
let client;
let clientPromise;


if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  return { client, db };
}

export default clientPromise;
