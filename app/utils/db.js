import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  serverSelectionTimeoutMS: 30000, // Optional: Time to wait for MongoDB connection
  socketTimeoutMS: 30000, // Optional: Socket timeout
};

let client;
let clientPromise;

if (!uri) {
  throw new Error("Please add your MongoDB URI to .env");
}

// In development mode, use a global variable so that the value is preserved across module reloads caused by HMR (Hot Module Replacement).
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new MongoClient and connect directly.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Helper function to get the database connection
export async function connectToDatabase() {
  if (!clientPromise) {
    throw new Error("MongoDB client promise is not initialized");
  }
  console.log("[MongoDB] Connecting to URI:", process.env.MONGODB_URI);
  console.log("[MongoDB] Using DB:", process.env.MONGODB_DB);
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  
  return {
    client,
    db,
  };
}

// Export a module-scoped MongoClient promise.
export default clientPromise;
