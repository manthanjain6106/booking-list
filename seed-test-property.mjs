import mongoose from "mongoose";
import "dotenv/config";
import Property from "./app/models/Property.js";
import Room from "./app/models/Room.js";
import { dbConnect } from "./app/utils/mongoose.js";

async function seed() {
  await dbConnect();

  // Create a property
  const property = await Property.create({
    host: new mongoose.Types.ObjectId(),
    name: "Test Property",
    uniqueUrl: "test-property",
    location: {
      address: "123 Main St",
      city: "Testville",
      state: "TS",
      country: "Testland",
      pinCode: "123456"
    },
    description: "A test property for booking.",
    paymentId: "test-payment-id",
    bankAccountName: "Test Owner",
    phoneNumbers: ["1234567890"],
    totalRooms: 10,
    pricing: { type: "perRoom", value: 2000 },
    amenities: ["WiFi", "TV"],
    images: [],
  });

  // Create a room for this property
  const room = await Room.create({
    property: property._id,
    name: "Deluxe Room",
    category: "Deluxe",
    roomNumber: "101",
    description: "A deluxe test room.",
    capacity: { adults: 2, children: 2, total: 4 },
    pricing: { price: 2000, type: "perRoom" },
    images: [],
    amenities: ["WiFi", "TV"]
  });

  console.log("Seeded property:", property._id, property.uniqueUrl);
  console.log("Seeded room:", room._id, room.property);

  mongoose.connection.close();
}

seed();
