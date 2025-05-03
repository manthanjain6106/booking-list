import { connectToDatabase } from "@/app/utils/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request data
    const data = await req.json();
    const { rooms } = data;
    
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return Response.json({ message: "Invalid room data" }, { status: 400 });
    }

    // Verify the property belongs to this host
    const hostUser = await db.collection('users').findOne({ email: session.user.email });
    if (!hostUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const propertyId = rooms[0].propertyId;
    const property = await db.collection('properties').findOne({ 
      _id: new ObjectId(propertyId) 
    });
    
    if (!property) {
      return Response.json({ message: "Property not found" }, { status: 404 });
    }

    if (property.host.toString() !== hostUser._id.toString()) {
      return Response.json({ 
        message: "You do not have permission to manage rooms for this property" 
      }, { status: 403 });
    }

 // Process each room
 const results = [];
 for (const room of rooms) {
   // Check if this room already exists
   const existingRoom = await db.collection('rooms').findOne({
     propertyId: new ObjectId(propertyId),
     roomNumber: room.roomNumber
   });

   let result;
   if (existingRoom) {
     // Update existing room
     result = await db.collection('rooms').updateOne(
       { _id: existingRoom._id },
       { 
         $set: {
           category: room.category,
           capacity: room.capacity,
           price: room.price,
           perPersonPrices: room.perPersonPrices,
           amenities: room.amenities,
           extraPersonCharge: room.extraPersonCharge,
           agentCommission: room.agentCommission,
           advanceAmount: room.advanceAmount,
           updatedAt: new Date()
         } 
       }
     );
     results.push({ 
       roomNumber: room.roomNumber, 
       action: 'updated', 
       success: result.modifiedCount > 0 
     });
   } else {
     // Create new room
     result = await db.collection('rooms').insertOne({
       propertyId: new ObjectId(propertyId),
       roomNumber: room.roomNumber,
       category: room.category,
       capacity: room.capacity,
       price: room.price,
       perPersonPrices: room.perPersonPrices,
       amenities: room.amenities,
       extraPersonCharge: room.extraPersonCharge,
       agentCommission: room.agentCommission,
       advanceAmount: room.advanceAmount,
       status: 'available',
       createdAt: new Date(),
       updatedAt: new Date()
     });
     results.push({ 
       roomNumber: room.roomNumber, 
       action: 'created', 
       success: !!result.insertedId,
       roomId: result.insertedId
     });
   }
 }

 return Response.json({
   success: true,
   message: `${results.length} rooms saved successfully`,
   results
 });
} catch (error) {
 console.error("Room management error:", error);
 return Response.json({
   message: error.message || "Failed to save rooms",
   success: false
 }, {
   status: 500
 });
}
}

export async function GET(req) {
try {
 // Connect to the database
 const { db } = await connectToDatabase();
 
 // Check authentication
 const session = await getServerSession(authOptions);
 if (!session) {
   return Response.json({ message: "Unauthorized" }, { status: 401 });
 }

 // Get propertyId from query parameters
 const url = new URL(req.url);
 const propertyId = url.searchParams.get('propertyId');
 
 if (!propertyId) {
   return Response.json({ message: "Property ID is required" }, { status: 400 });
 }

 // Verify the property belongs to this host
 const hostUser = await db.collection('users').findOne({ email: session.user.email });
 if (!hostUser) {
   return Response.json({ message: "User not found" }, { status: 404 });
 }

 const property = await db.collection('properties').findOne({ 
   _id: new ObjectId(propertyId) 
 });
 
 if (!property) {
   return Response.json({ message: "Property not found" }, { status: 404 });
 }

 if (property.host.toString() !== hostUser._id.toString()) {
   return Response.json({ 
     message: "You do not have permission to view rooms for this property" 
   }, { status: 403 });
 }

 // Get all rooms for this property
 const rooms = await db.collection('rooms')
   .find({ propertyId: new ObjectId(propertyId) })
   .toArray();

 return Response.json({
   success: true,
   rooms
 });
} catch (error) {
 console.error("Room fetch error:", error);
 return Response.json({
   message: error.message || "Failed to fetch rooms",
   success: false
 }, {
   status: 500
 });
}
}