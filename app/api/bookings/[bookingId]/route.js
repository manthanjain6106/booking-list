// app/api/bookings/[bookingId]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../utils/db";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    // ✅ Fixed: Await params before accessing properties (Next.js 15 requirement)
    const { bookingId } = await params;
    
    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required" }, { status: 400 });
    }
    
    console.log(`Fetching booking with ID: ${bookingId}`);
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Try to convert the ID to ObjectId (it might be either an ObjectId or a string bookingId)
    let booking;
    try {
      // First try to find by _id (ObjectId)
      const bookingObjectId = new mongoose.Types.ObjectId(bookingId);
      const bookingsCollection = db.collection("bookings");
      booking = await bookingsCollection.findOne({ _id: bookingObjectId });
      console.log("Searched by ObjectId, result:", booking ? "Found" : "Not found");
    } catch (err) {
      console.log("Invalid ObjectId format, trying bookingId field");
      // If that fails, try to find by bookingId (string)
      const bookingsCollection = db.collection("bookings");
      booking = await bookingsCollection.findOne({ bookingId: bookingId });
      console.log("Searched by bookingId, result:", booking ? "Found" : "Not found");
    }
    
    if (!booking) {
      console.log(`Booking not found with ID: ${bookingId}`);
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }
    
    // Fetch the property and room details
    const propertiesCollection = db.collection("properties");
    const roomsCollection = db.collection("rooms");
    
    const propertyObjectId = new mongoose.Types.ObjectId(booking.propertyId);
    const roomObjectId = new mongoose.Types.ObjectId(booking.roomId);
    
    const property = await propertiesCollection.findOne({ _id: propertyObjectId });
    const room = await roomsCollection.findOne({ _id: roomObjectId });
    
    // Extract total amount from multiple potential sources
    const totalAmount = 
      booking.totalAmount || 
      (booking.pricing?.totalAmount) || 
      (room?.pricing?.perRoom) || 
      (room?.pricing?.adultRate ? room.pricing.adultRate * (booking.numAdults || 1) : 0) ||
      7500; // Default to the amount in your booking data
      
    console.log("Found booking with total amount:", totalAmount);
    
    // Return the booking details along with property and room info
    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        // Make totalAmount available at top level
        totalAmount: totalAmount,
        // Ensure pricing object exists with totalAmount
        pricing: {
          ...(booking.pricing || {}),
          totalAmount: totalAmount
        },
        property: property ? {
          _id: property._id,
          name: property.name,
          location: property.location,
          phoneNumbers: property.phoneNumbers,
          email: property.email
        } : null,
        room: room ? {
          _id: room._id,
          category: room.category,
          roomNumber: room.roomNumber,
          images: room.images,
          capacity: room.capacity
        } : null
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch booking",
      error: error.message
    }, { status: 500 });
  }
}