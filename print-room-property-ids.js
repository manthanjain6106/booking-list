// Script to print all properties and rooms with their uniqueUrl, _id, and property fields
const mongoose = require("mongoose");
require("dotenv").config();
const Property = require("./app/models/Property.js").default;
const Room = require("./app/models/Room.js").default;
const { dbConnect } = require("./app/utils/mongoose.js");

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
