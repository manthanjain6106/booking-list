// app/api/bookings/route.js - Fixed for your db connection
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/app/utils/db";
import Booking from "@/app/models/Booking";
import Property from "@/app/models/Property";
import Room from "@/app/models/Room";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Parse booking data from request
    const data = await request.json();
    console.log("Booking data received:", data);
    
    // Validate required fields based on your Booking model
    if (
      !data.propertyId ||
      !data.roomId ||
      !data.guestName ||
      !data.guestPhone
    ) {
      return NextResponse.json(
        { message: "Missing required booking information" },
        { status: 400 }
      );
    }
    
    // Connect to database - adapting to your db connection method
    try {
      // Your db might already be connected by Next.js startup
      if (typeof connectDB === 'function') {
        await connectDB();
      }
    } catch (dbError) {
      console.log("Note: Database might already be connected:", dbError.message);
      // Continue execution, as the DB might already be connected
    }
    
    // Check if the room exists
    const room = await Room.findById(data.roomId);
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    
    // Check if the property exists
    const property = await Property.findById(data.propertyId);
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }
    
    // Calculate dates
    const checkIn = new Date(data.checkIn || new Date());
    const checkOut = new Date(data.checkOut || new Date(Date.now() + 86400000)); // Default to next day
    
    // Validate dates
    if (checkIn >= checkOut) {
      return NextResponse.json(
        { message: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }
    
    // Process child info - use both data formats for compatibility
    const youngerChildren = parseInt(data.youngerChildren) || (data.hasYoungerChildren ? parseInt(data.youngerChildrenCount) || 0 : 0);
    const olderChildren = parseInt(data.olderChildren) || (data.hasOlderChildren ? parseInt(data.olderChildrenCount) || 0 : 0);
    const totalChildren = youngerChildren + olderChildren;
    
    // Calculate total amount
    const roomRate = room.pricing?.price || parseFloat(data.totalAmount) || 0;
    const totalAmount = parseFloat(data.totalAmount) || roomRate;
    
    // Generate a booking reference like the one in your screenshot
    const bookingRef = `FRA-BE-${Date.now().toString().slice(-8)}-${property.name.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}-BOOKING`;
    
    // Determine who made the booking
    const userId = data.userId || session?.user?.id || new mongoose.Types.ObjectId();
    const bookedByRole = session?.user?.role || "guest";
    
    // Create the booking according to your model
    const booking = new Booking({
      propertyId: data.propertyId,
      roomId: data.roomId,
      // For compatibility with your client
      roomNumber: data.roomNumber || room.roomNumber,
      category: data.category || room.category,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail || "",
      guestAddress: data.guestAddress || "",
      // Keep your model structure as well
      bookedBy: userId,
      bookedByRole: bookedByRole,
      guestDetails: {
        name: data.guestName,
        email: data.guestEmail || "",
        phone: data.guestPhone,
        adults: parseInt(data.numAdults) || 1,
        children: totalChildren,
        specialRequests: data.specialRequests || ""
      },
      checkIn: checkIn,
      checkOut: checkOut,
      numAdults: parseInt(data.numAdults) || 1,
      numChildren: totalChildren,
      youngerChildren: youngerChildren,
      olderChildren: olderChildren,
      specialRequests: data.specialRequests || "",
      numberOfRooms: 1, // Assuming single room booking
      pricing: {
        roomRate: roomRate,
        totalAmount: totalAmount,
        advanceAmount: totalAmount * 0.5,
        balanceAmount: totalAmount * 0.5,
        agentCommission: 0 // No commission for direct bookings
      },
      // Change status to confirmed if that's what the client expects
      status: "confirmed", 
      bookingRef: bookingRef,
      history: [{
        action: "created",
        timestamp: new Date(),
        performedBy: userId,
        details: "Booking created"
      }]
    });
    
    await booking.save();
    console.log("Booking saved successfully:", booking._id);
    
    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId || booking._id,
          bookingRef: booking.bookingRef,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          guestName: booking.guestName,
          guestPhone: booking.guestPhone,
          totalAmount: totalAmount
        },
        property: {
          _id: property._id,
          name: property.name
        },
        room: {
          _id: room._id,
          category: room.category,
          roomNumber: room.roomNumber
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create booking", 
        error: error.message
      },
      { status: 500 }
    );
  }
}