// app/api/bookings/[bookingId]/status/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/app/utils/db";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  try {
    const { bookingId } = params;
    const body = await request.json();  
    const { status } = body;
    
    console.log(`Updating booking ${bookingId} status to ${status}`);
    
    // Validate status
    if (!["pending", "confirmed", "checked-in", "checked-out", "cancelled", "no-show", "declined"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    
    // Check if user is authenticated and is a host
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Connect to database directly
    const { db } = await connectToDatabase();
    const propertiesCollection = db.collection("properties");
    const bookingsCollection = db.collection("bookings");
    
    // Get ALL the host's properties (not just one)
    const hostProperties = await propertiesCollection.find({ 
      host: new mongoose.Types.ObjectId(session.user.id) 
    }).toArray();
    
    if (hostProperties.length === 0) {
      return NextResponse.json({ message: "No properties found for this host" }, { status: 404 });
    }
    
    // Get all property IDs owned by this host
    const propertyIds = hostProperties.map(prop => prop._id.toString());
    
    // Find the booking
    let booking;
    try {
      // Try to find by ObjectId first
      const bookingObjectId = new mongoose.Types.ObjectId(bookingId);
      booking = await bookingsCollection.findOne({ _id: bookingObjectId });
    } catch (err) {
      // If that fails, try to find by bookingId string
      booking = await bookingsCollection.findOne({ bookingId: bookingId });
    }
    
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    
    // Verify the booking belongs to one of this host's properties
    if (!propertyIds.includes(booking.propertyId.toString())) {
      return NextResponse.json({ 
        message: "Unauthorized: Booking does not belong to your properties"
      }, { status: 403 });
    }
    
    // Add history entry for this status change
    const historyEntry = {
      action: status === 'cancelled' || status === 'declined' ? 'cancelled' : 'modified',
      timestamp: new Date(),
      performedBy: session.user.id,
      details: `Status changed to ${status}`
    };
    
    // Update booking status directly in the database
    const updateResult = await bookingsCollection.updateOne(
      { _id: booking._id },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        },
        $push: { 
          history: historyEntry
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ message: "Failed to update booking status" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: `Booking ${status} successfully`,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId || booking._id,
        status: status,
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ 
      message: "Failed to update booking status", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}