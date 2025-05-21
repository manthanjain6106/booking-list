const mongoose = require("mongoose");
require("dotenv").config();

// Dynamically import ESM modules
async function run() {
  const Property = (await import("./app/models/Property.js")).default;
  const Room = (await import("./app/models/Room.js")).default;
  const { dbConnect } = await import("./app/utils/mongoose.js");

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

run();
