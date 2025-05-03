import { connectToDatabase } from "@/app/utils/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

export async function DELETE(req, { params }) {
  try {
    const { roomId } = params;
    
    if (!roomId || !ObjectId.isValid(roomId)) {
      return Response.json({ success: false, message: "Invalid room ID" }, { status: 400 });
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the room
    const room = await db.collection('rooms').findOne({ 
      _id: new ObjectId(roomId) 
    });
    
    if (!room) {
      return Response.json({ 
        success: false, 
        message: "Room not found" 
      }, { status: 404 });
    }

    // Verify the property belongs to this host
    const hostUser = await db.collection('users').findOne({ email: session.user.email });
    if (!hostUser) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const property = await db.collection('properties').findOne({ 
      _id: new ObjectId(room.propertyId) 
    });
    
    if (!property) {
      return Response.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    if (property.host.toString() !== hostUser._id.toString() && hostUser.role !== 'admin') {
      return Response.json({ 
        success: false, 
        message: "You do not have permission to delete rooms for this property" 
      }, { status: 403 });
    }

    // Check if room has active bookings
    const activeBookings = await db.collection('bookings').countDocuments({
      roomId: new ObjectId(roomId),
      status: { $in: ['confirmed', 'checked-in'] }
    });
    
    if (activeBookings > 0) {
      return Response.json({ 
        success: false, 
        message: "Cannot delete room with active bookings" 
      }, { status: 400 });
    }
    
    // Delete the room
    const result = await db.collection('rooms').deleteOne({ 
      _id: new ObjectId(roomId) 
    });
    
    if (result.deletedCount === 0) {
      return Response.json({ 
        success: false, 
        message: "Failed to delete room" 
      }, { status: 500 });
    }
    
    return Response.json({
      success: true,
      message: "Room deleted successfully"
    });
    
  } catch (error) {
    console.error("Room deletion error:", error);
    return Response.json({
      success: false,
      message: error.message || "Failed to delete room"
    }, {
      status: 500
    });
  }
}