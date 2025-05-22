// app/api/bookings/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth//[...nextauth]";
import { connectToDatabase } from "@/app/utils/db"; 
import mongoose from "mongoose";

// Generate a unique bookingId
const generateBookingId = () => {
  const timestamp = new Date().getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

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
    
    // Connect to the database
    console.log("Connecting to database...");
    const { db } = await connectToDatabase();
    console.log("Connected to database:", process.env.MONGODB_DB);
    
    // Convert ID to ObjectId
    const roomObjectId = new mongoose.Types.ObjectId(data.roomId);
    const propertyObjectId = new mongoose.Types.ObjectId(data.propertyId);
    
    // Use the native MongoDB driver to find the room
    console.log("Looking for room directly in MongoDB...");
    const roomsCollection = db.collection("rooms");
    const room = await roomsCollection.findOne({ _id: roomObjectId });
    
    if (!room) {
      console.log(`Room not found with ID: ${data.roomId}`);
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    
    console.log("Room found:", room._id);
    console.log("Room property:", room.property);
    
    // Check if the room belongs to the correct property
    if (!room.property.equals(propertyObjectId)) {
      console.log(`Room ${data.roomId} belongs to property ${room.property}, not ${data.propertyId}`);
      return NextResponse.json({ message: "Room does not belong to the specified property" }, { status: 400 });
    }
    
    // Get property data
    const propertiesCollection = db.collection("properties");
    const property = await propertiesCollection.findOne({ _id: propertyObjectId });
    
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
    const roomRate = room.pricing?.perRoom || room.pricing?.adultRate || parseFloat(data.totalAmount) || 0;
    const totalAmount = parseFloat(data.totalAmount) || roomRate;
    
    // Generate a booking reference
    const bookingRef = `FRA-BE-${Date.now().toString().slice(-8)}-${property.name.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}-BOOKING`;
    
    // Determine who made the booking
    const userId = data.userId || (session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : null);
    
    // Create booking object with a unique bookingId
    const bookingData = {
      bookingId: generateBookingId(), // This is the key addition - a unique bookingId
      propertyId: data.propertyId,
      roomId: data.roomId,
      roomNumber: data.roomNumber || room.roomNumber,
      category: data.category || room.category,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail || "",
      guestAddress: data.guestAddress || "",
      bookedBy: userId,
      bookedByRole: session?.user?.role || "guest",
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
      numberOfRooms: 1,
      pricing: {
        roomRate: roomRate,
        totalAmount: totalAmount,
        advanceAmount: totalAmount * 0.5,
        balanceAmount: totalAmount * 0.5,
        agentCommission: 0
      },
      status: "pending", // Changed from "confirmed" to "pending"
      bookingRef: bookingRef,
      history: [{
        action: "created",
        timestamp: new Date(),
        performedBy: userId,
        details: "Booking created"
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert booking directly using MongoDB
    console.log("Creating booking...");
    const bookingsCollection = db.collection("bookings");
    const result = await bookingsCollection.insertOne(bookingData);
    
    console.log("Booking saved successfully:", result.insertedId);
    
    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: {
          _id: result.insertedId,
          bookingId: bookingData.bookingId,
          bookingRef: bookingRef,
          checkIn: checkIn,
          checkOut: checkOut,
          status: "pending", // Changed from "confirmed" to "pending"
          guestName: data.guestName,
          guestPhone: data.guestPhone,
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
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create booking", 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// You can also add a GET handler to fetch bookings
export async function GET(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Build the query
    const query = {};
    if (propertyId) query.propertyId = propertyId;
    if (userId) query.bookedBy = userId;
    if (status) query.status = status;
    
    // Fetch bookings
    const bookingsCollection = db.collection("bookings");
    const bookings = await bookingsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      bookings: bookings
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch bookings",
      error: error.message
    }, { status: 500 });
  }
}