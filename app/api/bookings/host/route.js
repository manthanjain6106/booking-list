// app/api/bookings/[bookingId]/status/route.js - Fixed for your DB connection
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/app/utils/db";
import Booking from "@/app/models/Booking";
import Property from "@/app/models/Property";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
  try {
    const { bookingId } = params;
    const body = await request.json();
    const { status } = body;
    
    console.log(`Updating booking ${bookingId} status to ${status}`);
    
    // Validate status - based on your model's enum values
    if (!["pending", "confirmed", "checked-in", "checked-out", "cancelled", "no-show", "declined"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    
    // Check if user is authenticated and is a host
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "host") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Connect to database - adapting to your db connection method
    try {
      // Your db might already be connected by Next.js startup
      // or connectDB might be an object, not a function
      if (typeof connectDB === 'function') {
        await connectDB();
      }
    } catch (dbError) {
      console.log("Note: Database might already be connected:", dbError.message);
      // Continue execution, as the DB might already be connected
    }
    
    // Get the host's property
    const property = await Property.findOne({ host: session.user.id });
    if (!property) {
      return NextResponse.json({ message: "No property found for this host" }, { status: 404 });
    }
    
    // Find the booking - could be by _id or bookingId depending on what's in params
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    } else {
      booking = await Booking.findOne({ bookingId: bookingId });
    }
    
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    
    // Verify the booking belongs to this host's property
    if (booking.propertyId.toString() !== property._id.toString()) {
      return NextResponse.json({ 
        message: "Unauthorized: Booking does not belong to your property"
      }, { status: 403 });
    }
    
    // Update booking status
    booking.status = status;
    
    // Add history entry for this status change
    booking.history.push({
      action: status === 'cancelled' || status === 'declined' ? 'cancelled' : 'modified',
      timestamp: new Date(),
      performedBy: session.user.id,
      details: `Status changed to ${status}`
    });
    
    // Update the updatedAt timestamp
    booking.updatedAt = new Date();
    
    // Save the booking
    await booking.save();
    
    return NextResponse.json({ 
      message: `Booking ${status} successfully`,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    });
    
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ 
      message: "Failed to update booking status", 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}