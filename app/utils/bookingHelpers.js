// app/utils/bookingHelpers.js
import { dbConnect } from "../utils/mongoose";
import Room from "../models/Room";
import Property from "../models/Property";

export async function getRoomAndProperty(uniqueUrl, roomId) {
  try {
    console.log("Finding property and room with:", { uniqueUrl, roomId });
    await dbConnect();
    
    // Find the property by uniqueUrl
    const property = await Property.findOne({ uniqueUrl });
    
    if (!property) {
      console.error(`Property not found with uniqueUrl: ${uniqueUrl}`);
      return { room: null, property: null };
    }
    
    console.log("Found property:", property._id);
    
    // Find the room by ID
    const room = await Room.findById(roomId);
    
    if (!room) {
      console.error(`Room not found with ID: ${roomId}`);
      return { room: null, property: null };
    }
    
    console.log("Found room with property field:", room.property);
    
    // Check if the room belongs to this property
    // In your Room model, the field is named 'property'
    if (room.property.toString() !== property._id.toString()) {
      console.error(`Room ${roomId} does not belong to property ${property._id}`);
      return { room: null, property: null };
    }
    
    // Convert Mongoose documents to plain objects for client components
    return { 
      room: JSON.parse(JSON.stringify(room)), 
      property: JSON.parse(JSON.stringify(property))
    };
  } catch (error) {
    console.error('Error in getRoomAndProperty:', error);
    return { room: null, property: null };
  }
}