import mongoose from "mongoose";
import "dotenv/config";
import Property from "./app/models/Property.js";
import Room from "./app/models/Room.js";
import { dbConnect } from "./app/utils/mongoose.js";

async function printData() {
  await dbConnect();
  const properties = await Property.find({});
  const rooms = await Room.find({});

  console.log("Properties:");
  properties.forEach((p) => {
    console.log(`- _id: ${p._id}, uniqueUrl: ${p.uniqueUrl}`);
  });

  console.log("\nRooms:");
  rooms.forEach((r) => {
    console.log(`- _id: ${r._id}, property: ${r.property}`);
  });

  mongoose.connection.close();
}

printData();
